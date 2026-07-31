import "server-only";

import { and, eq, inArray, isNull, or } from "drizzle-orm";

import { getDb } from "@/db";
import { getBookFormOptions } from "@/db/queries/admin-editorial";
import { authors, bookEditions, books, mediaAssets } from "@/db/schema";
import { slugify } from "@/lib/slug";

import { saveAuthor } from "./author-service";
import { EditorialServiceError } from "./action-state";
import type { BookInput } from "./book-input";
import type { BookImportActionState, BookImportReportItem } from "./book-import-types";
import { saveBook } from "./book-service";
import { normalizeMediaImportKey } from "./media-service";

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_ROWS = 200;

export const bookImportHeaders = [
  "identificator_carte",
  "titlu",
  "autor",
  "identificator_autor",
  "biografie_autor",
  "titlu_original",
  "slug",
  "rezumat",
  "verdict",
  "de_ce_merita",
  "limite",
  "puncte_forte",
  "eticheta_editie",
  "isbn10",
  "isbn13",
  "editura",
  "an_publicare",
  "limba",
  "numar_pagini",
  "genuri",
  "teme",
  "atmosfere",
  "audiente",
  "identificator_coperta",
] as const;

type Header = (typeof bookImportHeaders)[number];
type CsvRow = Record<Header, string>;

type ParsedImportRow = {
  row: number;
  identifier: string;
  title: string;
  author: string;
  authorIdentifier?: string;
  authorBio?: string;
  originalTitle?: string;
  slug: string;
  summary?: string;
  verdict?: string;
  whyRead?: string;
  caveats: string[];
  strengths: string[];
  editionLabel?: string;
  isbn10?: string;
  isbn13?: string;
  publisher?: string;
  publicationYear?: number;
  language: string;
  pageCount?: number;
  genres: string[];
  themes: string[];
  moods: string[];
  audiences: string[];
  coverIdentifier?: string;
};

function csvError(row: number, identifier: string, title: string, message: string): BookImportReportItem {
  return { row, identifier: identifier || `rand-${row}`, title: title || "—", message };
}

function parseCsv(text: string) {
  const input = text.replace(/^\uFEFF/, "").replace(/^sep=;\s*\r?\n/i, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ";" && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new EditorialServiceError("Fișierul CSV conține un câmp între ghilimele care nu este închis.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function list(value: string) {
  return [...new Set(value.split("|").map((item) => item.trim()).filter(Boolean))];
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function integer(value: string, label: string, row: number, minimum: number, maximum: number) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new EditorialServiceError(`Rândul ${row}: „${label}” trebuie să fie un număr între ${minimum} și ${maximum}.`);
  }
  return parsed;
}

function normalizedLookup(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseRows(fileRows: string[][]): { rows: ParsedImportRow[]; errors: BookImportReportItem[] } {
  const headerRow = fileRows[0];
  if (!headerRow || fileRows.length < 2) throw new EditorialServiceError("Fișierul nu conține cărți de importat.");
  const headers = headerRow.map((item) => normalizedLookup(item).replaceAll("-", "_"));
  const missingHeaders = bookImportHeaders.filter(
    (header) => header !== "identificator_autor" && !headers.includes(header),
  );
  if (missingHeaders.length) throw new EditorialServiceError(`Lipsesc coloanele: ${missingHeaders.join(", ")}. Descarcă din nou fișierul-model.`);

  const rows: ParsedImportRow[] = [];
  const errors: BookImportReportItem[] = [];
  const identifiers = new Set<string>();
  const isbnValues = new Set<string>();

  for (const [offset, values] of fileRows.slice(1).entries()) {
    const rowNumber = offset + 2;
    const record = Object.fromEntries(bookImportHeaders.map((header) => [header, values[headers.indexOf(header)] ?? ""])) as CsvRow;
    const identifier = normalizeMediaImportKey(record.identificator_carte);
    const title = record.titlu.trim();
    const author = record.autor.trim();

    try {
      if (!identifier) throw new EditorialServiceError("Identificatorul cărții este obligatoriu.");
      if (identifiers.has(identifier)) throw new EditorialServiceError("Identificator duplicat în fișier.");
      if (!title || title.length > 300) throw new EditorialServiceError("Titlul este obligatoriu și poate avea maximum 300 de caractere.");
      if (author.length < 2 || author.length > 200) throw new EditorialServiceError("Autorul este obligatoriu și poate avea maximum 200 de caractere.");
      const isbn10 = optional(record.isbn10)?.replaceAll("-", "").toUpperCase();
      const isbn13 = optional(record.isbn13)?.replaceAll("-", "");
      if (isbn10 && !/^[0-9X]{10}$/.test(isbn10)) throw new EditorialServiceError("ISBN-10 nu este valid.");
      if (isbn13 && !/^[0-9]{13}$/.test(isbn13)) throw new EditorialServiceError("ISBN-13 nu este valid.");
      for (const isbn of [isbn10, isbn13].filter(Boolean) as string[]) {
        if (isbnValues.has(isbn)) throw new EditorialServiceError(`ISBN duplicat în fișier: ${isbn}.`);
        isbnValues.add(isbn);
      }
      const language = record.limba.trim() || "ro";
      if (language.length < 2 || language.length > 12) throw new EditorialServiceError("Codul limbii trebuie să aibă între 2 și 12 caractere.");
      const desiredSlug = optional(record.slug) ?? slugify(`${title}-${author}`);
      if (!desiredSlug) throw new EditorialServiceError("Slugul nu a putut fi generat.");
      const rawAuthorIdentifier = optional(record.identificator_autor);
      const authorIdentifier = rawAuthorIdentifier
        ? normalizeMediaImportKey(rawAuthorIdentifier)
        : undefined;
      if (rawAuthorIdentifier && !authorIdentifier) {
        throw new EditorialServiceError("Identificatorul autorului nu este valid.");
      }

      identifiers.add(identifier);
      rows.push({
        row: rowNumber,
        identifier,
        title,
        author,
        authorIdentifier,
        authorBio: optional(record.biografie_autor),
        originalTitle: optional(record.titlu_original),
        slug: slugify(desiredSlug),
        summary: optional(record.rezumat),
        verdict: optional(record.verdict),
        whyRead: optional(record.de_ce_merita),
        caveats: list(record.limite),
        strengths: list(record.puncte_forte),
        editionLabel: optional(record.eticheta_editie),
        isbn10,
        isbn13,
        publisher: optional(record.editura),
        publicationYear: integer(record.an_publicare, "an_publicare", rowNumber, 1450, 3000),
        language,
        pageCount: integer(record.numar_pagini, "numar_pagini", rowNumber, 1, 100_000),
        genres: list(record.genuri),
        themes: list(record.teme),
        moods: list(record.atmosfere),
        audiences: list(record.audiente),
        coverIdentifier: optional(record.identificator_coperta)
          ? normalizeMediaImportKey(record.identificator_coperta)
          : identifier,
      });
    } catch (error) {
      errors.push(csvError(rowNumber, identifier, title, error instanceof Error ? error.message : "Rând invalid."));
    }
  }
  return { rows, errors };
}

function taxonomyMap(rows: Array<{ id: string; name: string; slug?: string }>) {
  const result = new Map<string, string>();
  for (const row of rows) {
    result.set(normalizedLookup(row.name), row.id);
    if (row.slug) result.set(normalizedLookup(row.slug), row.id);
  }
  return result;
}

function taxonomyIds(values: string[], index: Map<string, string>, label: string, row: ParsedImportRow) {
  const missing: string[] = [];
  const ids = values.flatMap((value) => {
    const id = index.get(normalizedLookup(value));
    if (!id) missing.push(value);
    return id ? [id] : [];
  });
  if (missing.length) throw new EditorialServiceError(`Rândul ${row.row}: ${label} inexistente în admin: ${missing.join(", ")}.`);
  return [...new Set(ids)];
}

async function uniqueAuthorSlug(name: string) {
  const db = getDb();
  const base = slugify(name);
  for (let suffix = 1; suffix <= 999; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base.slice(0, 150)}-${suffix}`;
    const [existing] = await db.select({ id: authors.id }).from(authors).where(eq(authors.slug, candidate)).limit(1);
    if (!existing) return candidate;
  }
  throw new EditorialServiceError(`Nu am putut genera un slug unic pentru autorul ${name}.`);
}

export async function importBooksFromCsv(file: File, actorUserId: string): Promise<BookImportActionState> {
  if (!file.name.toLowerCase().endsWith(".csv")) return { status: "error", message: "Încarcă un fișier CSV bazat pe modelul disponibil.", imported: [], skipped: [], errors: [] };
  if (file.size === 0 || file.size > MAX_IMPORT_BYTES) return { status: "error", message: "Fișierul trebuie să aibă maximum 2 MB.", imported: [], skipped: [], errors: [] };

  let parsed: ReturnType<typeof parseRows>;
  try {
    const rawRows = parseCsv(await file.text());
    if (rawRows.length - 1 > MAX_IMPORT_ROWS) throw new EditorialServiceError(`Importă maximum ${MAX_IMPORT_ROWS} de cărți într-un singur fișier.`);
    parsed = parseRows(rawRows);
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Fișierul nu a putut fi citit.", imported: [], skipped: [], errors: [] };
  }

  if (parsed.errors.length) {
    return { status: "error", message: "Importul nu a pornit. Corectează rândurile indicate și încarcă din nou fișierul.", imported: [], skipped: [], errors: parsed.errors };
  }

  const db = getDb();
  const options = await getBookFormOptions(db);
  const genreIndex = taxonomyMap(options.genres);
  const themeIndex = taxonomyMap(options.themes);
  const moodIndex = taxonomyMap(options.moods);
  const audienceIndex = taxonomyMap(options.audiences);
  const validationErrors: BookImportReportItem[] = [];
  const prepared = parsed.rows.flatMap((row) => {
    try {
      return [{
        row,
        genreIds: taxonomyIds(row.genres, genreIndex, "Genuri", row),
        themeIds: taxonomyIds(row.themes, themeIndex, "Teme", row),
        moodIds: taxonomyIds(row.moods, moodIndex, "Atmosfere", row),
        audienceIds: taxonomyIds(row.audiences, audienceIndex, "Audiențe", row),
      }];
    } catch (error) {
      validationErrors.push(csvError(row.row, row.identifier, row.title, error instanceof Error ? error.message : "Taxonomie invalidă."));
      return [];
    }
  });
  if (validationErrors.length) return { status: "error", message: "Importul nu a pornit. Corectează taxonomiile indicate.", imported: [], skipped: [], errors: validationErrors };

  const coverKeys = [...new Set(parsed.rows.map((row) => row.coverIdentifier).filter(Boolean) as string[])];
  const [authorRows, coverRows, existingBookRows, existingEditionRows] = await Promise.all([
    db.select({ id: authors.id, name: authors.name, importKey: authors.importKey }).from(authors).where(and(isNull(authors.deletedAt), or(eq(authors.status, "draft"), eq(authors.status, "needs_review"), eq(authors.status, "published")))),
    coverKeys.length
      ? db.select({ id: mediaAssets.id, importKey: mediaAssets.importKey }).from(mediaAssets).where(and(inArray(mediaAssets.importKey, coverKeys), eq(mediaAssets.status, "active"), isNull(mediaAssets.deletedAt)))
      : Promise.resolve([]),
    db.select({ id: books.id, slug: books.slug, importKey: books.importKey }).from(books).where(isNull(books.deletedAt)),
    db.select({ isbn10: bookEditions.isbn10, isbn13: bookEditions.isbn13 }).from(bookEditions),
  ]);

  const authorIndex = new Map(authorRows.map((row) => [normalizedLookup(row.name), row.id]));
  const authorImportIndex = new Map(authorRows.flatMap((row) => row.importKey ? [[row.importKey, row.id] as const] : []));
  const coverIndex = new Map(coverRows.flatMap((row) => row.importKey ? [[row.importKey, row.id] as const] : []));
  const existingSlugs = new Map(existingBookRows.map((row) => [row.slug, row.id]));
  const existingImportKeys = new Map(existingBookRows.flatMap((row) => row.importKey ? [[row.importKey, row.id] as const] : []));
  const existingIsbns = new Set(existingEditionRows.flatMap((row) => [row.isbn10, row.isbn13]).filter(Boolean) as string[]);
  const imported: BookImportReportItem[] = [];
  const skipped: BookImportReportItem[] = [];
  const errors: BookImportReportItem[] = [];

  const missingAuthorReferences = parsed.rows.filter(
    (row) => row.authorIdentifier && !authorImportIndex.has(row.authorIdentifier),
  );
  if (missingAuthorReferences.length) {
    return {
      status: "error",
      message: "Importul nu a pornit. Unii autori identificați în CSV nu există încă. Importă mai întâi autorii sau corectează identificatorii.",
      imported: [],
      skipped: [],
      errors: missingAuthorReferences.map((row) => csvError(
        row.row,
        row.identifier,
        row.title,
        `Nu există autorul cu identificatorul „${row.authorIdentifier}”.`,
      )),
    };
  }

  for (const item of prepared) {
    const { row } = item;
    const matchingKey = row.coverIdentifier ?? row.identifier;
    if (existingImportKeys.has(matchingKey)) {
      skipped.push(csvError(row.row, row.identifier, row.title, "Cartea există deja în catalog (același identificator de import)."));
      continue;
    }
    const duplicateIsbn = [row.isbn10, row.isbn13].find((isbn) => isbn && existingIsbns.has(isbn));
    if (duplicateIsbn) {
      skipped.push(csvError(row.row, row.identifier, row.title, `Există deja o ediție cu ISBN ${duplicateIsbn}.`));
      continue;
    }
    if (existingSlugs.has(row.slug)) {
      skipped.push(csvError(row.row, row.identifier, row.title, "Cartea există deja în catalog (același slug)."));
      continue;
    }

    try {
      const authorKey = normalizedLookup(row.author);
      let authorId = row.authorIdentifier
        ? authorImportIndex.get(row.authorIdentifier)
        : authorIndex.get(authorKey);
      if (!authorId) {
        authorId = await saveAuthor({
          name: row.author,
          slug: await uniqueAuthorSlug(row.author),
          bio: row.authorBio,
          verifiedFacts: undefined,
          sourceNotes: "Creat automat prin importul de cărți.",
          status: "draft",
        }, actorUserId);
        authorIndex.set(authorKey, authorId);
      }

      const coverAssetId = row.coverIdentifier ? coverIndex.get(row.coverIdentifier) : undefined;
      const input: BookInput = {
        title: row.title,
        importKey: matchingKey,
        originalTitle: row.originalTitle,
        slug: row.slug,
        authorId,
        summary: row.summary,
        verdict: row.verdict,
        whyRead: row.whyRead,
        whyNot: row.caveats.length ? row.caveats.join("\n") : undefined,
        strengths: row.strengths,
        caveats: row.caveats,
        status: "draft",
        editorialConfidence: 0,
        edition: {
          label: row.editionLabel,
          isbn10: row.isbn10,
          isbn13: row.isbn13,
          publisher: row.publisher,
          publicationYear: row.publicationYear,
          language: row.language,
          pageCount: row.pageCount,
          coverAssetId,
          active: true,
        },
        genreIds: item.genreIds,
        themeIds: item.themeIds,
        moodIds: item.moodIds,
        audienceIds: item.audienceIds,
        traitScores: [],
        seo: { indexable: false },
      };
      const bookId = await saveBook(input, actorUserId);
      existingSlugs.set(row.slug, bookId);
      existingImportKeys.set(matchingKey, bookId);
      if (row.isbn10) existingIsbns.add(row.isbn10);
      if (row.isbn13) existingIsbns.add(row.isbn13);
      imported.push({
        row: row.row,
        identifier: row.identifier,
        title: row.title,
        bookId,
        message: coverAssetId ? "Creată ca ciornă, cu coperta asociată." : `Creată ca ciornă; coperta „${row.coverIdentifier}” nu a fost găsită.`,
      });
    } catch (error) {
      errors.push(csvError(row.row, row.identifier, row.title, error instanceof Error ? error.message : "Cartea nu a putut fi creată."));
    }
  }

  const status = errors.length ? "error" as const : "success" as const;
  return {
    status,
    message: `${imported.length} cărți importate, ${skipped.length} omise, ${errors.length} cu erori.`,
    imported,
    skipped,
    errors,
  };
}
