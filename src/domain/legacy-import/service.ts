import "server-only";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { eq, isNull } from "drizzle-orm";
import sharp from "sharp";

import type { Database } from "@/db";
import {
  authors,
  bookEditions,
  bookGenres,
  bookMoods,
  bookOffers,
  books,
  bookThemes,
  dailyFeatures,
  editors,
  genres,
  legacyImportRecords,
  legacyReviewQuarantine,
  mediaAssets,
  moods,
  retailers,
  seoMetadata,
  themes,
} from "@/db/schema";
import { deleteMediaObject, putMediaObject } from "@/lib/storage/s3";

import type { LegacyImportConfig } from "./config";
import type {
  InvalidLegacyRecord,
  LegacyAuthor,
  LegacyBook,
  LegacyDailyFeature,
  LegacyMedia,
  LegacyReview,
  NormalizedLegacyExport,
} from "./input";
import {
  approvedRetailerSlug,
  chunked,
  contentHash,
  legacyRedirectPath,
  normalizeLookup,
  resolveMediaPath,
  slugifyLegacy,
} from "./normalize";
import type {
  DuplicateFinding,
  ImportLogEntry,
  ImportReject,
  ImportSourceType,
  LegacyImportResult,
  QuarantineReportRow,
  RedirectSuggestion,
} from "./report";

type LegacyTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type SourceType = "author" | "media" | "book" | "review" | "daily_feature";
type TargetRef = { id?: string; label: string; planned: boolean; slug?: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const supportedImages = {
  jpeg: { mime: "image/jpeg", extension: "jpg" },
  png: { mime: "image/png", extension: "png" },
  webp: { mime: "image/webp", extension: "webp" },
  avif: { mime: "image/avif", extension: "avif" },
} as const;

type ImportContext = {
  dryRun: boolean;
  config: LegacyImportConfig;
  logs: ImportLogEntry[];
  rejects: ImportReject[];
  duplicates: DuplicateFinding[];
  redirects: RedirectSuggestion[];
  quarantine: QuarantineReportRow[];
  counts: LegacyImportResult["counts"];
};

function sourceKey(sourceType: SourceType, legacyId: string) {
  return `${sourceType}:${legacyId}`;
}

function log(context: ImportContext, entry: Omit<ImportLogEntry, "timestamp">) {
  context.logs.push({ timestamp: new Date().toISOString(), ...entry });
}

function reject(context: ImportContext, sourceType: ImportSourceType, legacyId: string | undefined, reason: string) {
  context.rejects.push({ sourceType, legacyId, reason });
  context.counts.rejected += 1;
  log(context, { level: "error", sourceType, legacyId, action: "reject", message: reason });
}

function warn(context: ImportContext, sourceType: ImportSourceType, legacyId: string | undefined, message: string) {
  context.counts.warnings += 1;
  log(context, { level: "warning", sourceType, legacyId, action: "skip", message });
}

function addRedirect(context: ImportContext, input: { legacyUrl?: string; destination: string; sourceType: "author" | "book"; legacyId: string }) {
  try {
    const source = legacyRedirectPath(input.legacyUrl, context.config.legacyOrigins);
    if (!source) {
      if (input.legacyUrl) warn(context, input.sourceType, input.legacyId, "URL-ul legacy nu aparține unei origini aprobate; nu a fost propus redirect.");
      return;
    }
    if (source === "/" || source === input.destination) return;
    if (context.redirects.some((suggestion) => suggestion.source === source && suggestion.destination === input.destination)) return;
    if (context.redirects.some((suggestion) => suggestion.source === source)) {
      warn(context, input.sourceType, input.legacyId, `URL-ul legacy ${source} indică mai multe destinații; sugestia necesită reconciliere manuală.`);
      return;
    }
    context.redirects.push({
      source,
      destination: input.destination,
      sourceType: input.sourceType,
      legacyId: input.legacyId,
      reason: "URL legacy verificat ca aparținând unei origini configurate.",
      status: "pending_review",
    });
  } catch {
    warn(context, input.sourceType, input.legacyId, "URL-ul legacy nu poate produce o sugestie de redirect validă.");
  }
}

function mappingIndex(mapping: Record<string, string>, label: string) {
  const normalized = normalizeLookup(label);
  return Object.entries(mapping).find(([legacyLabel]) => normalizeLookup(legacyLabel) === normalized)?.[1];
}

function duplicateLegacyIds<T extends { legacyId: string }>(rows: T[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.legacyId)) duplicates.add(row.legacyId);
    else seen.add(row.legacyId);
  }
  return duplicates;
}

function duplicateValues<T>(rows: T[], valueOf: (row: T) => string | undefined) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of rows) {
    const value = valueOf(row);
    if (!value) continue;
    if (seen.has(value)) duplicates.add(value);
    else seen.add(value);
  }
  return duplicates;
}

async function insertImportRecord(
  transaction: LegacyTransaction,
  input: {
    sourceSystem: string;
    sourceType: SourceType;
    legacyId: string;
    sourceUrl?: string;
    hash: string;
    targetEntityType: string;
    targetEntityId?: string;
    outcome: "imported" | "linked" | "quarantined";
  },
) {
  const [record] = await transaction.insert(legacyImportRecords).values({
    sourceSystem: input.sourceSystem,
    sourceType: input.sourceType,
    legacyId: input.legacyId,
    sourceUrl: input.sourceUrl ?? null,
    contentHash: input.hash,
    targetEntityType: input.targetEntityType,
    targetEntityId: input.targetEntityId ?? null,
    outcome: input.outcome,
  }).returning({ id: legacyImportRecords.id });
  if (!record) throw new Error(`Identitatea legacy ${input.sourceType}:${input.legacyId} nu a putut fi salvată.`);
  return record.id;
}

function handleExistingIdentity(
  context: ImportContext,
  existing: { contentHash: string; targetEntityId: string | null } | undefined,
  input: { sourceType: SourceType; legacyId: string; hash: string },
) {
  if (!existing) return false;
  if (existing.contentHash !== input.hash) {
    reject(context, input.sourceType, input.legacyId, "Sursa s-a schimbat după importul inițial; actualizarea necesită revizuire manuală.");
    context.duplicates.push({ sourceType: input.sourceType, legacyId: input.legacyId, matchedBy: "source_identity", targetId: existing.targetEntityId ?? undefined, resolution: "rejected" });
    return true;
  }
  context.counts.skipped += 1;
  context.duplicates.push({ sourceType: input.sourceType, legacyId: input.legacyId, matchedBy: "source_identity", targetId: existing.targetEntityId ?? undefined, resolution: "skipped" });
  log(context, { level: "info", sourceType: input.sourceType, legacyId: input.legacyId, action: "skip", message: "Înregistrarea a fost deja importată cu același hash.", targetId: existing.targetEntityId ?? undefined });
  return true;
}

export async function runLegacyImport({
  db,
  data,
  invalid,
  config,
  dryRun,
  rawInput,
}: {
  db: Database;
  data: NormalizedLegacyExport;
  invalid: InvalidLegacyRecord[];
  config: LegacyImportConfig;
  dryRun: boolean;
  rawInput: unknown;
}): Promise<LegacyImportResult> {
  const startedAt = new Date().toISOString();
  const context: ImportContext = {
    dryRun,
    config,
    logs: [],
    rejects: [],
    duplicates: [],
    redirects: [],
    quarantine: [],
    counts: { imported: 0, linked: 0, skipped: 0, quarantined: 0, rejected: 0, warnings: 0 },
  };

  for (const row of invalid) reject(context, row.sourceType, row.legacyId, `Înregistrare invalidă la indexul ${row.index}: ${row.issues.join("; ")}`);
  for (const [section, count] of Object.entries(data.ignoredCounts)) {
    if (count) warn(context, "settings", undefined, `${count} intrări din ${section} au fost ignorate; setările legacy nu se publică automat.`);
  }

  const [
    importRows,
    authorRows,
    bookRows,
    editionRows,
    mediaRows,
    genreRows,
    themeRows,
    moodRows,
    retailerRows,
    dailyRows,
    editorRows,
  ] = await Promise.all([
    db.select().from(legacyImportRecords).where(eq(legacyImportRecords.sourceSystem, config.sourceSystem)),
    db.select({ id: authors.id, name: authors.name, slug: authors.slug }).from(authors).where(isNull(authors.deletedAt)),
    db.select({ id: books.id, title: books.title, slug: books.slug, authorId: books.primaryAuthorId }).from(books).where(isNull(books.deletedAt)),
    db.select({ id: bookEditions.id, bookId: bookEditions.bookId, isbn10: bookEditions.isbn10, isbn13: bookEditions.isbn13 }).from(bookEditions).where(isNull(bookEditions.deletedAt)),
    db.select({ id: mediaAssets.id, storageKey: mediaAssets.storageKey }).from(mediaAssets).where(isNull(mediaAssets.deletedAt)),
    db.select({ id: genres.id, slug: genres.slug }).from(genres).where(isNull(genres.deletedAt)),
    db.select({ id: themes.id, slug: themes.slug }).from(themes).where(isNull(themes.deletedAt)),
    db.select({ id: moods.id, slug: moods.slug }).from(moods).where(isNull(moods.deletedAt)),
    db.select({ id: retailers.id, slug: retailers.slug }).from(retailers).where(isNull(retailers.deletedAt)),
    db.select({ id: dailyFeatures.id, date: dailyFeatures.featureDate, bookId: dailyFeatures.bookId }).from(dailyFeatures).where(isNull(dailyFeatures.deletedAt)),
    db.select({ id: editors.id }).from(editors).where(isNull(editors.deletedAt)),
  ]);

  const importIdentities = new Map(importRows.map((row) => [sourceKey(row.sourceType, row.legacyId), row]));
  const authorTargets = new Map<string, TargetRef>();
  const authorByName = new Map<string, TargetRef>(authorRows.map((row) => [normalizeLookup(row.name), { id: row.id, label: row.name, planned: false, slug: row.slug }]));
  const authorBySlug = new Map<string, TargetRef>(authorRows.map((row) => [row.slug, { id: row.id, label: row.name, planned: false, slug: row.slug }]));
  const authorById = new Map(authorRows.map((row) => [row.id, row]));
  const bookTargets = new Map<string, TargetRef>();
  const bookBySlug = new Map<string, TargetRef & { authorId?: string }>(bookRows.map((row) => [row.slug, { id: row.id, label: row.title, planned: false, slug: row.slug, authorId: row.authorId }]));
  const bookById = new Map(bookRows.map((row) => [row.id, row]));
  const bookByIsbn = new Map(editionRows.flatMap((row) => [row.isbn10, row.isbn13].filter((isbn): isbn is string => Boolean(isbn)).map((isbn) => [isbn, row.bookId] as const)));
  const mediaTargets = new Map<string, TargetRef>();
  const mediaByStorageKey = new Map(mediaRows.map((row) => [row.storageKey, row.id]));
  const validMediaIds = new Set(mediaRows.map((row) => row.id));
  const taxonomyIds = {
    genres: new Map(genreRows.map((row) => [row.slug, row.id])),
    themes: new Map(themeRows.map((row) => [row.slug, row.id])),
    moods: new Map(moodRows.map((row) => [row.slug, row.id])),
  };
  const retailerBySlug = new Map(retailerRows.map((row) => [row.slug, row.id]));
  const dailyByDate = new Map(dailyRows.map((row) => [row.date, row]));
  const validEditorIds = new Set(editorRows.map((row) => row.id));

  const duplicateIds = {
    author: duplicateLegacyIds(data.authors),
    media: duplicateLegacyIds(data.media),
    book: duplicateLegacyIds(data.books),
    review: duplicateLegacyIds(data.reviews),
    daily_feature: duplicateLegacyIds(data.dailyFeatures),
  };
  const duplicateAuthorSlugs = duplicateValues(data.authors, (row) => slugifyLegacy(row.slug ?? row.name));
  const duplicateBookSlugs = duplicateValues(data.books, (row) => slugifyLegacy(row.slug ?? row.title));
  const duplicateBookIsbns = duplicateValues(data.books, (row) => row.isbn13 ?? row.isbn10);
  const duplicateDailyDates = duplicateValues(data.dailyFeatures, (row) => row.date);

  async function processAuthor(row: LegacyAuthor, transaction?: LegacyTransaction) {
    if (duplicateIds.author.has(row.legacyId)) return reject(context, "author", row.legacyId, "Identificator legacy duplicat în același export.");
    const hash = contentHash(row);
    const existingIdentity = importIdentities.get(sourceKey("author", row.legacyId));
    if (handleExistingIdentity(context, existingIdentity, { sourceType: "author", legacyId: row.legacyId, hash })) {
      const existingAuthor = existingIdentity?.targetEntityId ? authorById.get(existingIdentity.targetEntityId) : undefined;
      if (existingAuthor) authorTargets.set(row.legacyId, { id: existingAuthor.id, label: existingAuthor.name, planned: false, slug: existingAuthor.slug });
      return;
    }
    const slug = slugifyLegacy(row.slug ?? row.name);
    if (!slug) return reject(context, "author", row.legacyId, "Slugul autorului nu poate fi normalizat.");
    if (duplicateAuthorSlugs.has(slug)) {
      context.duplicates.push({ sourceType: "author", legacyId: row.legacyId, matchedBy: "slug", resolution: "rejected" });
      return reject(context, "author", row.legacyId, "Mai multe înregistrări din export normalizează la același slug de autor.");
    }
    const slugMatch = authorBySlug.get(slug);
    const nameMatch = authorByName.get(normalizeLookup(row.name));
    if (slugMatch && normalizeLookup(slugMatch.label) !== normalizeLookup(row.name)) {
      context.duplicates.push({ sourceType: "author", legacyId: row.legacyId, matchedBy: "slug", targetId: slugMatch.id, resolution: "rejected" });
      return reject(context, "author", row.legacyId, "Slugul aparține unui autor cu alt nume; este necesară reconciliere manuală.");
    }
    const duplicate = slugMatch ?? nameMatch;
    if (duplicate) {
      if (transaction) await insertImportRecord(transaction, { sourceSystem: config.sourceSystem, sourceType: "author", legacyId: row.legacyId, sourceUrl: row.legacyUrl, hash, targetEntityType: "author", targetEntityId: duplicate.id, outcome: "linked" });
      authorTargets.set(row.legacyId, duplicate);
      context.counts.linked += 1;
      context.duplicates.push({ sourceType: "author", legacyId: row.legacyId, matchedBy: authorBySlug.has(slug) ? "slug" : "name", targetId: duplicate.id, resolution: "linked" });
      log(context, { level: "info", sourceType: "author", legacyId: row.legacyId, action: "link", message: "Autorul legacy a fost legat de profilul existent.", targetId: duplicate.id });
      addRedirect(context, { legacyUrl: row.legacyUrl, destination: `/autor/${duplicate.slug ?? slug}`, sourceType: "author", legacyId: row.legacyId });
      return;
    }
    if (!transaction) {
      const planned = { label: row.name, planned: true, slug };
      authorTargets.set(row.legacyId, planned);
      authorBySlug.set(slug, planned);
      authorByName.set(normalizeLookup(row.name), planned);
      context.counts.imported += 1;
      log(context, { level: "info", sourceType: "author", legacyId: row.legacyId, action: "import", message: "Autorul ar fi importat cu status needs_review." });
    } else {
      const [inserted] = await transaction.insert(authors).values({ name: row.name, slug, bio: row.bio ?? null, sourceNotes: row.legacyUrl ? `Import legacy: ${row.legacyUrl}` : "Import legacy; sursa necesită verificare.", status: "needs_review" }).returning({ id: authors.id });
      if (!inserted) throw new Error(`Autorul ${row.legacyId} nu a putut fi inserat.`);
      await insertImportRecord(transaction, { sourceSystem: config.sourceSystem, sourceType: "author", legacyId: row.legacyId, sourceUrl: row.legacyUrl, hash, targetEntityType: "author", targetEntityId: inserted.id, outcome: "imported" });
      const target = { id: inserted.id, label: row.name, planned: false, slug };
      authorTargets.set(row.legacyId, target);
      authorBySlug.set(slug, target);
      authorByName.set(normalizeLookup(row.name), target);
      context.counts.imported += 1;
      log(context, { level: "info", sourceType: "author", legacyId: row.legacyId, action: "import", message: "Autor importat cu status needs_review.", targetId: inserted.id });
    }
    addRedirect(context, { legacyUrl: row.legacyUrl, destination: `/autor/${slug}`, sourceType: "author", legacyId: row.legacyId });
  }

  for (const batch of chunked(data.authors, config.batchSize)) {
    if (dryRun) for (const row of batch) await processAuthor(row);
    else await db.transaction(async (transaction) => { for (const row of batch) await processAuthor(row, transaction); });
  }

  async function processMedia(row: LegacyMedia) {
    if (duplicateIds.media.has(row.legacyId)) return reject(context, "media", row.legacyId, "Identificator legacy duplicat în același export.");
    let bytes: Uint8Array;
    let resolvedPath: string;
    try {
      resolvedPath = resolveMediaPath(config.mediaRoot, row.filePath);
      bytes = new Uint8Array(await readFile(resolvedPath));
    } catch (error) {
      return reject(context, "media", row.legacyId, error instanceof Error ? error.message : "Fișier media inaccesibil.");
    }
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return reject(context, "media", row.legacyId, "Imaginea este goală sau depășește 5 MB.");
    let metadata: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
    try {
      metadata = await sharp(bytes, { failOn: "warning", limitInputPixels: 40_000_000 }).metadata();
    } catch {
      return reject(context, "media", row.legacyId, "Fișierul nu este o imagine validă.");
    }
    const format = metadata.format as keyof typeof supportedImages | undefined;
    const accepted = format ? supportedImages[format] : undefined;
    if (!accepted || !metadata.width || !metadata.height) return reject(context, "media", row.legacyId, "Format media neacceptat sau dimensiuni lipsă.");
    const fileHash = createHash("sha256").update(bytes).digest();
    const hash = contentHash({ ...row, sha256: fileHash.toString("hex") });
    const existingIdentity = importIdentities.get(sourceKey("media", row.legacyId));
    if (handleExistingIdentity(context, existingIdentity, { sourceType: "media", legacyId: row.legacyId, hash })) {
      if (existingIdentity?.targetEntityId && validMediaIds.has(existingIdentity.targetEntityId)) mediaTargets.set(row.legacyId, { id: existingIdentity.targetEntityId, label: row.filePath, planned: false });
      return;
    }
    const storageKey = `media/legacy/${slugifyLegacy(config.sourceSystem)}/${fileHash.toString("hex")}.${accepted.extension}`;
    const existingMediaId = mediaByStorageKey.get(storageKey);
    if (existingMediaId) {
      if (!dryRun) await db.transaction(async (transaction) => { await insertImportRecord(transaction, { sourceSystem: config.sourceSystem, sourceType: "media", legacyId: row.legacyId, sourceUrl: row.sourceUrl, hash, targetEntityType: "media_asset", targetEntityId: existingMediaId, outcome: "linked" }); });
      mediaTargets.set(row.legacyId, { id: existingMediaId, label: row.filePath, planned: false });
      context.counts.linked += 1;
      context.duplicates.push({ sourceType: "media", legacyId: row.legacyId, matchedBy: "storage_hash", targetId: existingMediaId, resolution: "linked" });
      log(context, { level: "info", sourceType: "media", legacyId: row.legacyId, action: "link", message: "Fișierul identic există deja în stocare.", targetId: existingMediaId });
      return;
    }
    if (dryRun) {
      mediaTargets.set(row.legacyId, { label: row.filePath, planned: true });
      context.counts.imported += 1;
      log(context, { level: "info", sourceType: "media", legacyId: row.legacyId, action: "import", message: "Imaginea ar fi reîncărcată prin adaptorul S3." });
      return;
    }
    await putMediaObject({ key: storageKey, body: bytes, contentType: accepted.mime, checksumSha256Base64: fileHash.toString("base64") });
    try {
      await db.transaction(async (transaction) => {
        const [inserted] = await transaction.insert(mediaAssets).values({
          storageKey,
          mimeType: accepted.mime,
          byteSize: bytes.length,
          width: metadata.width!,
          height: metadata.height!,
          altText: row.altText,
          attribution: row.attribution ?? null,
          source: row.sourceLabel ?? `Import legacy ${config.sourceSystem}`,
          sourceUrl: row.sourceUrl ?? null,
        }).returning({ id: mediaAssets.id });
        if (!inserted) throw new Error(`Media ${row.legacyId} nu a putut fi inserată.`);
        await insertImportRecord(transaction, { sourceSystem: config.sourceSystem, sourceType: "media", legacyId: row.legacyId, sourceUrl: row.sourceUrl, hash, targetEntityType: "media_asset", targetEntityId: inserted.id, outcome: "imported" });
        mediaTargets.set(row.legacyId, { id: inserted.id, label: row.filePath, planned: false });
        mediaByStorageKey.set(storageKey, inserted.id);
        context.counts.imported += 1;
        log(context, { level: "info", sourceType: "media", legacyId: row.legacyId, action: "import", message: "Imagine reîncărcată cu proveniență păstrată.", targetId: inserted.id });
      });
    } catch (error) {
      await deleteMediaObject(storageKey).catch(() => undefined);
      throw error;
    }
  }

  for (const row of data.media) await processMedia(row);

  function resolveAuthor(row: LegacyBook) {
    if (row.authorLegacyId) {
      const target = authorTargets.get(row.authorLegacyId);
      if (target) return target;
    }
    return row.authorName ? authorByName.get(normalizeLookup(row.authorName)) : undefined;
  }

  async function processBook(row: LegacyBook, transaction?: LegacyTransaction) {
    if (duplicateIds.book.has(row.legacyId)) return reject(context, "book", row.legacyId, "Identificator legacy duplicat în același export.");
    const hash = contentHash(row);
    const existingIdentity = importIdentities.get(sourceKey("book", row.legacyId));
    if (handleExistingIdentity(context, existingIdentity, { sourceType: "book", legacyId: row.legacyId, hash })) {
      const existingBook = existingIdentity?.targetEntityId ? bookById.get(existingIdentity.targetEntityId) : undefined;
      if (existingBook) bookTargets.set(row.legacyId, { id: existingBook.id, label: existingBook.title, planned: false, slug: existingBook.slug });
      return;
    }
    const author = resolveAuthor(row);
    if (!author) return reject(context, "book", row.legacyId, "Autorul nu poate fi rezolvat prin legacy ID sau nume controlat.");
    const slug = slugifyLegacy(row.slug ?? row.title);
    if (!slug) return reject(context, "book", row.legacyId, "Slugul cărții nu poate fi normalizat.");
    if (duplicateBookSlugs.has(slug)) {
      context.duplicates.push({ sourceType: "book", legacyId: row.legacyId, matchedBy: "slug", resolution: "rejected" });
      return reject(context, "book", row.legacyId, "Mai multe înregistrări din export normalizează la același slug de carte.");
    }
    const sourceIsbn = row.isbn13 ?? row.isbn10;
    if (sourceIsbn && duplicateBookIsbns.has(sourceIsbn)) {
      context.duplicates.push({ sourceType: "book", legacyId: row.legacyId, matchedBy: "isbn", resolution: "rejected" });
      return reject(context, "book", row.legacyId, "ISBN-ul apare pe mai multe înregistrări din același export.");
    }
    const isbnBookId = row.isbn13 ? bookByIsbn.get(row.isbn13) : row.isbn10 ? bookByIsbn.get(row.isbn10) : undefined;
    const slugDuplicate = bookBySlug.get(slug);
    const duplicateId = isbnBookId ?? slugDuplicate?.id;
    if (duplicateId) {
      const duplicateBook = bookById.get(duplicateId);
      const sameIdentity = Boolean(duplicateBook && author.id && normalizeLookup(duplicateBook.title) === normalizeLookup(row.title) && duplicateBook.authorId === author.id);
      if (!sameIdentity) {
        context.duplicates.push({ sourceType: "book", legacyId: row.legacyId, matchedBy: isbnBookId ? "isbn" : "slug", targetId: duplicateId, resolution: "rejected" });
        return reject(context, "book", row.legacyId, "Slugul sau ISBN-ul aparține unei alte cărți; este necesară reconciliere manuală.");
      }
      if (transaction) await insertImportRecord(transaction, { sourceSystem: config.sourceSystem, sourceType: "book", legacyId: row.legacyId, sourceUrl: row.legacyUrl, hash, targetEntityType: "book", targetEntityId: duplicateId, outcome: "linked" });
      const target = { id: duplicateId, label: row.title, planned: false };
      bookTargets.set(row.legacyId, target);
      context.counts.linked += 1;
      context.duplicates.push({ sourceType: "book", legacyId: row.legacyId, matchedBy: isbnBookId ? "isbn" : "slug", targetId: duplicateId, resolution: "linked" });
      log(context, { level: "info", sourceType: "book", legacyId: row.legacyId, action: "link", message: "Cartea legacy a fost legată de opera existentă.", targetId: duplicateId });
      addRedirect(context, { legacyUrl: row.legacyUrl, destination: `/carte/${duplicateBook?.slug ?? slug}`, sourceType: "book", legacyId: row.legacyId });
      return;
    }
    if (!transaction) {
      const target = { label: row.title, planned: true, slug };
      bookTargets.set(row.legacyId, target);
      bookBySlug.set(slug, { ...target, authorId: author.id });
      context.counts.imported += 1;
      log(context, { level: "info", sourceType: "book", legacyId: row.legacyId, action: "import", message: "Cartea și ediția ar fi importate cu status needs_review." });
    } else {
      if (!author.id) throw new Error(`Autorul planificat pentru cartea ${row.legacyId} nu are ID după import.`);
      const [insertedBook] = await transaction.insert(books).values({
        title: row.title,
        subtitle: row.subtitle ?? null,
        slug,
        originalTitle: row.originalTitle ?? null,
        primaryAuthorId: author.id,
        shortVerdict: row.verdict ?? null,
        spoilerFreeSummary: row.summary ?? null,
        status: "needs_review",
        editorialConfidence: 0,
      }).returning({ id: books.id });
      if (!insertedBook) throw new Error(`Cartea ${row.legacyId} nu a putut fi inserată.`);
      const cover = row.coverLegacyId ? mediaTargets.get(row.coverLegacyId) : undefined;
      if (row.coverLegacyId && !cover?.id) warn(context, "book", row.legacyId, "Referința la copertă nu a fost importată; ediția rămâne fără copertă.");
      const [edition] = await transaction.insert(bookEditions).values({
        bookId: insertedBook.id,
        isbn10: row.isbn10 ?? null,
        isbn13: row.isbn13 ?? null,
        publisher: row.publisher ?? null,
        publicationYear: row.publicationYear ?? null,
        language: row.language,
        pageCount: row.pageCount ?? null,
        coverAssetId: cover?.id ?? null,
        editionLabel: `Import legacy ${config.sourceSystem}`,
        active: true,
      }).returning({ id: bookEditions.id });
      if (!edition) throw new Error(`Ediția cărții ${row.legacyId} nu a putut fi inserată.`);
      await transaction.insert(seoMetadata).values({ entityType: "book", entityId: insertedBook.id, indexable: false });

      const taxonomySets = [
        { kind: "genres" as const, values: row.genres, mapping: config.taxonomyMappings.genres },
        { kind: "themes" as const, values: row.themes, mapping: config.taxonomyMappings.themes },
        { kind: "moods" as const, values: row.moods, mapping: config.taxonomyMappings.moods },
      ];
      for (const set of taxonomySets) {
        for (const label of set.values) {
          const slugTarget = mappingIndex(set.mapping, label);
          const taxonomyId = slugTarget ? taxonomyIds[set.kind].get(slugTarget) : undefined;
          if (!taxonomyId) {
            warn(context, "book", row.legacyId, `Eticheta legacy „${label}” (${set.kind}) nu are mapping către o taxonomie controlată.`);
            context.rejects.push({ sourceType: "book", legacyId: row.legacyId, reason: `Taxonomie neasociată: ${set.kind}:${label}` });
            continue;
          }
          if (set.kind === "genres") await transaction.insert(bookGenres).values({ bookId: insertedBook.id, genreId: taxonomyId }).onConflictDoNothing();
          if (set.kind === "themes") await transaction.insert(bookThemes).values({ bookId: insertedBook.id, themeId: taxonomyId }).onConflictDoNothing();
          if (set.kind === "moods") await transaction.insert(bookMoods).values({ bookId: insertedBook.id, moodId: taxonomyId, strength: 50 }).onConflictDoNothing();
        }
      }

      let offerOrder = 100;
      for (const purchaseUrl of [...new Set(row.purchaseUrls)]) {
        const retailerSlug = approvedRetailerSlug(purchaseUrl, config.retailerHosts);
        const retailerId = retailerSlug ? retailerBySlug.get(retailerSlug) : undefined;
        if (!retailerId) {
          warn(context, "book", row.legacyId, `URL-ul comercial ${purchaseUrl} nu are host aprobat și partener existent; oferta nu a fost creată.`);
          context.rejects.push({ sourceType: "book", legacyId: row.legacyId, reason: `Ofertă respinsă: host nemapat pentru ${purchaseUrl}` });
          continue;
        }
        await transaction.insert(bookOffers).values({
          editionId: edition.id,
          retailerId,
          purchaseUrl,
          affiliate: false,
          isPrimary: false,
          displayOrder: offerOrder,
          availability: "unknown",
          source: `legacy:${config.sourceSystem}`,
          active: false,
        }).onConflictDoNothing();
        offerOrder += 10;
      }

      await insertImportRecord(transaction, { sourceSystem: config.sourceSystem, sourceType: "book", legacyId: row.legacyId, sourceUrl: row.legacyUrl, hash, targetEntityType: "book", targetEntityId: insertedBook.id, outcome: "imported" });
      const target = { id: insertedBook.id, label: row.title, planned: false, slug };
      bookTargets.set(row.legacyId, target);
      bookBySlug.set(slug, { ...target, authorId: author.id });
      bookById.set(insertedBook.id, { id: insertedBook.id, title: row.title, slug, authorId: author.id });
      context.counts.imported += 1;
      log(context, { level: "info", sourceType: "book", legacyId: row.legacyId, action: "import", message: "Carte și ediție importate pentru revizuire; SEO și ofertele rămân inactive.", targetId: insertedBook.id });
    }
    addRedirect(context, { legacyUrl: row.legacyUrl, destination: `/carte/${slug}`, sourceType: "book", legacyId: row.legacyId });
  }

  for (const batch of chunked(data.books, config.batchSize)) {
    if (dryRun) for (const row of batch) await processBook(row);
    else await db.transaction(async (transaction) => { for (const row of batch) await processBook(row, transaction); });
  }

  function resolveBook(legacyId?: string, slug?: string) {
    if (legacyId) {
      const target = bookTargets.get(legacyId);
      if (target) return target;
    }
    return slug ? bookBySlug.get(slugifyLegacy(slug)) : undefined;
  }

  async function processReview(row: LegacyReview, transaction?: LegacyTransaction) {
    if (duplicateIds.review.has(row.legacyId)) return reject(context, "review", row.legacyId, "Identificator legacy duplicat în același export.");
    const hash = contentHash(row);
    const existingIdentity = importIdentities.get(sourceKey("review", row.legacyId));
    if (handleExistingIdentity(context, existingIdentity, { sourceType: "review", legacyId: row.legacyId, hash })) return;
    const book = resolveBook(row.bookLegacyId, row.bookSlug);
    const verified = Boolean(row.originVerified && row.verificationNote && row.sourceUrl);
    if (row.originVerified && !verified) warn(context, "review", row.legacyId, "Marcajul verified a fost demotat: lipsesc nota de verificare sau URL-ul sursei.");
    const reason = verified
      ? "Originea are dovezi declarate, dar conținutul necesită aprobare editorială explicită înainte de orice reutilizare."
      : "Originea sau dreptul de reutilizare nu este verificat; recenzia nu poate fi publicată.";
    if (transaction) {
      const importRecordId = await insertImportRecord(transaction, { sourceSystem: config.sourceSystem, sourceType: "review", legacyId: row.legacyId, sourceUrl: row.sourceUrl, hash, targetEntityType: "legacy_review_quarantine", outcome: "quarantined" });
      const [quarantine] = await transaction.insert(legacyReviewQuarantine).values({
        importRecordId,
        bookId: book?.id ?? null,
        legacyBookReference: row.bookLegacyId ?? row.bookSlug ?? null,
        reviewerName: row.reviewerName ?? null,
        sourceLabel: row.sourceLabel ?? null,
        sourceUrl: row.sourceUrl ?? null,
        body: row.body,
        originVerified: verified,
        verificationNote: row.verificationNote ?? null,
        quarantineReason: reason,
        status: verified ? "verified" : "quarantined",
      }).returning({ id: legacyReviewQuarantine.id });
      if (!quarantine) throw new Error(`Recenzia ${row.legacyId} nu a putut fi pusă în carantină.`);
      await transaction.update(legacyImportRecords).set({ targetEntityId: quarantine.id }).where(eq(legacyImportRecords.id, importRecordId));
    }
    context.counts.quarantined += 1;
    context.quarantine.push({
      legacyId: row.legacyId,
      reviewer: row.reviewerName ?? "necunoscut",
      source: row.sourceUrl ?? row.sourceLabel ?? "nespecificată",
      linkedBook: book?.label ?? row.bookLegacyId ?? row.bookSlug ?? "nelegată",
      originVerified: verified,
      reason,
    });
    log(context, { level: "info", sourceType: "review", legacyId: row.legacyId, action: "quarantine", message: reason, targetId: book?.id });
  }

  for (const batch of chunked(data.reviews, config.batchSize)) {
    if (dryRun) for (const row of batch) await processReview(row);
    else await db.transaction(async (transaction) => { for (const row of batch) await processReview(row, transaction); });
  }

  async function processDailyFeature(row: LegacyDailyFeature, transaction?: LegacyTransaction) {
    if (duplicateIds.daily_feature.has(row.legacyId)) return reject(context, "daily_feature", row.legacyId, "Identificator legacy duplicat în același export.");
    if (duplicateDailyDates.has(row.date)) {
      context.duplicates.push({ sourceType: "daily_feature", legacyId: row.legacyId, matchedBy: "date", resolution: "rejected" });
      return reject(context, "daily_feature", row.legacyId, "Exportul conține mai multe selecții pentru aceeași dată.");
    }
    const evidenceSource = config.verifiedDailyFeatures[row.date];
    if (!evidenceSource) return reject(context, "daily_feature", row.legacyId, "Data nu are o dovadă istorică aprobată în configurație.");
    if (!config.defaultEditorId || !validEditorIds.has(config.defaultEditorId)) return reject(context, "daily_feature", row.legacyId, "defaultEditorId lipsește sau nu identifică un editor activ.");
    const book = resolveBook(row.bookLegacyId, row.bookSlug);
    if (!book) return reject(context, "daily_feature", row.legacyId, "Cartea selecției istorice nu poate fi rezolvată.");
    const hash = contentHash({ ...row, evidenceSource });
    const existingIdentity = importIdentities.get(sourceKey("daily_feature", row.legacyId));
    if (handleExistingIdentity(context, existingIdentity, { sourceType: "daily_feature", legacyId: row.legacyId, hash })) return;
    const dateDuplicate = dailyByDate.get(row.date);
    if (dateDuplicate) {
      if (!book.id || dateDuplicate.bookId !== book.id) {
        context.duplicates.push({ sourceType: "daily_feature", legacyId: row.legacyId, matchedBy: "date", targetId: dateDuplicate.id, resolution: "rejected" });
        return reject(context, "daily_feature", row.legacyId, "Data este deja ocupată de o altă selecție editorială.");
      }
      if (transaction) await insertImportRecord(transaction, { sourceSystem: config.sourceSystem, sourceType: "daily_feature", legacyId: row.legacyId, sourceUrl: evidenceSource, hash, targetEntityType: "daily_feature", targetEntityId: dateDuplicate.id, outcome: "linked" });
      context.counts.linked += 1;
      context.duplicates.push({ sourceType: "daily_feature", legacyId: row.legacyId, matchedBy: "date", targetId: dateDuplicate.id, resolution: "linked" });
      log(context, { level: "info", sourceType: "daily_feature", legacyId: row.legacyId, action: "link", message: "Selecția istorică este deja reprezentată la aceeași dată.", targetId: dateDuplicate.id });
      return;
    }
    if (!transaction) {
      context.counts.imported += 1;
      log(context, { level: "info", sourceType: "daily_feature", legacyId: row.legacyId, action: "import", message: "Selecția verificată ar fi importată ca draft, fără publicare automată." });
      return;
    }
    if (!book.id) throw new Error(`Cartea planificată pentru selecția ${row.legacyId} nu are ID după import.`);
    const [inserted] = await transaction.insert(dailyFeatures).values({
      featureDate: row.date,
      bookId: book.id,
      editorId: config.defaultEditorId,
      headline: row.headline ?? null,
      whyToday: row.whyToday ?? null,
      audienceNote: row.audienceNote ?? null,
      caveat: row.caveat ?? null,
      fitPoints: row.fitPoints,
      status: "draft",
    }).returning({ id: dailyFeatures.id });
    if (!inserted) throw new Error(`Selecția istorică ${row.legacyId} nu a putut fi inserată.`);
    await insertImportRecord(transaction, { sourceSystem: config.sourceSystem, sourceType: "daily_feature", legacyId: row.legacyId, sourceUrl: evidenceSource, hash, targetEntityType: "daily_feature", targetEntityId: inserted.id, outcome: "imported" });
    dailyByDate.set(row.date, { id: inserted.id, date: row.date, bookId: book.id });
    context.counts.imported += 1;
    log(context, { level: "info", sourceType: "daily_feature", legacyId: row.legacyId, action: "import", message: "Selecție istorică importată ca draft cu dovada păstrată în identitatea importului.", targetId: inserted.id });
  }

  for (const batch of chunked(data.dailyFeatures, config.batchSize)) {
    if (dryRun) for (const row of batch) await processDailyFeature(row);
    else await db.transaction(async (transaction) => { for (const row of batch) await processDailyFeature(row, transaction); });
  }

  return {
    mode: dryRun ? "dry-run" : "apply",
    sourceSystem: config.sourceSystem,
    startedAt,
    finishedAt: new Date().toISOString(),
    inputDigest: contentHash(rawInput),
    counts: context.counts,
    ignoredLegacySections: data.ignoredCounts,
    logs: context.logs,
    rejects: context.rejects,
    duplicates: context.duplicates,
    redirects: context.redirects,
    quarantine: context.quarantine,
  };
}
