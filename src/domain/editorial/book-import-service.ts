import "server-only";

import { and, eq, inArray, isNull, or } from "drizzle-orm";

import { getDb } from "@/db";
import { getBookFormOptions } from "@/db/queries/admin-editorial";
import { authors, bookEditions, books, mediaAssets } from "@/db/schema";
import { slugify } from "@/lib/slug";

import { EditorialServiceError } from "./action-state";
import { assignAuthorImportKey, saveAuthor } from "./author-service";
import type { BookInput } from "./book-input";
import type { BookImportActionState, BookImportReportItem } from "./book-import-types";
import { saveBook } from "./book-service";

const MAX_IMPORT_BYTES = 4 * 1024 * 1024;
const MAX_IMPORT_ROWS = 500;
const importKeyPattern = /^[a-z0-9][a-z0-9_-]{1,159}$/;

export const bookImportHeaders = [
  "identificator_carte",
  "titlu",
  "titlu_original",
  "slug",
  "identificator_autor",
  "autor",
  "slug_autor",
  "biografie_autor",
  "fapte_verificate_autor",
  "note_surse_autor",
  "identificator_coperta",
  "text_alternativ_coperta",
  "isbn10",
  "isbn13",
  "an_publicare",
  "limba",
  "numar_pagini",
  "rezumat",
  "verdict",
  "de_ce_merita",
  "de_ce_nu",
  "puncte_forte",
  "rezerve",
  "incredere_editoriala",
  "genuri",
  "teme",
  "atmosfere",
  "audiente",
  "scoruri_lectura",
  "titlu_seo",
  "descriere_seo",
  "canonical_seo",
  "indexabil",
] as const;

type Header = (typeof bookImportHeaders)[number];
type CsvRow = Record<Header, string>;

type TraitScore = { code: string; score: number; confidence: number };

type ParsedImportRow = {
  row: number;
  identifier: string;
  title: string;
  originalTitle?: string;
  slug: string;
  authorIdentifier: string;
  authorName: string;
  authorSlug: string;
  authorBio?: string;
  authorVerifiedFacts?: string;
  authorSourceNotes?: string;
  coverIdentifier?: string;
  coverAlt?: string;
  isbn10?: string;
  isbn13?: string;
  publicationYear?: number;
  language: string;
  pageCount?: number;
  summary?: string;
  verdict?: string;
  whyRead?: string;
  whyNot?: string;
  strengths: string[];
  caveats: string[];
  editorialConfidence: number;
  genres: string[];
  themes: string[];
  moods: string[];
  audiences: string[];
  traitScores: TraitScore[];
  seoTitle?: string;
  seoDescription?: string;
  seoCanonical?: string;
  seoIndexable: boolean;
};

type LooseRecord = Record<string, unknown>;

function csvError(row: number, identifier: string, title: string, message: string): BookImportReportItem {
  return { row, identifier: identifier || `rand-${row}`, title: title || "—", message };
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizedLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function importKey(value: string, label: string) {
  const result = value.trim();
  if (!importKeyPattern.test(result)) {
    throw new EditorialServiceError(`${label} trebuie să conțină numai litere mici, cifre, „-” sau „_” și să aibă minimum 2 caractere.`);
  }
  return result;
}

function list(value: string) {
  return [...new Set(value.split("|").map((item) => item.trim()).filter(Boolean))];
}

function stringList(value: unknown) {
  if (Array.isArray(value)) return [...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))];
  return typeof value === "string" ? list(value) : [];
}

function integerValue(value: unknown, label: string, row: number, minimum: number, maximum: number, fallback?: number) {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new EditorialServiceError(`Rândul ${row}: „${label}” trebuie să fie un număr între ${minimum} și ${maximum}.`);
  }
  return parsed;
}

function booleanValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string" || !value.trim()) return fallback;
  return ["1", "true", "da", "yes"].includes(value.trim().toLowerCase());
}

function parseTraitString(value: string, row: number) {
  if (!value.trim()) return [];
  return list(value).map((item) => {
    const [code = "", rawScore = "", rawConfidence = ""] = item.split(":").map((part) => part.trim());
    if (!code) throw new EditorialServiceError(`Rândul ${row}: scor de lectură fără cod.`);
    return {
      code,
      score: integerValue(rawScore, `scor ${code}`, row, 0, 100) ?? 0,
      confidence: integerValue(rawConfidence, `încredere ${code}`, row, 0, 100, 0) ?? 0,
    };
  });
}

function parseTraitJson(value: unknown, row: number): TraitScore[] {
  if (typeof value === "string") return parseTraitString(value, row);
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item);
    const code = stringFrom(record, "code");
    if (!code) throw new EditorialServiceError(`Rândul ${row}: scor de lectură fără cod.`);
    return {
      code,
      score: integerValue(record.score, `scor ${code}`, row, 0, 100) ?? 0,
      confidence: integerValue(record.confidence, `încredere ${code}`, row, 0, 100, 0) ?? 0,
    };
  });
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

function asRecord(value: unknown): LooseRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as LooseRecord;
}

function valueFrom(record: LooseRecord, ...keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function stringFrom(record: LooseRecord, ...keys: string[]) {
  const value = valueFrom(record, ...keys);
  return value === undefined ? "" : String(value).trim();
}

function buildRow(input: {
  row: number;
  identifier: string;
  title: string;
  originalTitle?: string;
  slug?: string;
  authorIdentifier: string;
  authorName: string;
  authorSlug?: string;
  authorBio?: string;
  authorVerifiedFacts?: string;
  authorSourceNotes?: string;
  coverIdentifier?: string;
  coverAlt?: string;
  isbn10?: string;
  isbn13?: string;
  publicationYear?: unknown;
  language?: string;
  pageCount?: unknown;
  summary?: string;
  verdict?: string;
  whyRead?: string;
  whyNot?: string;
  strengths?: string[];
  caveats?: string[];
  editorialConfidence?: unknown;
  genres?: string[];
  themes?: string[];
  moods?: string[];
  audiences?: string[];
  traitScores?: TraitScore[];
  seoTitle?: string;
  seoDescription?: string;
  seoCanonical?: string;
  seoIndexable?: unknown;
}): ParsedImportRow {
  const identifier = importKey(input.identifier, "Identificatorul cărții");
  const authorIdentifier = importKey(input.authorIdentifier, "Identificatorul autorului");
  const coverIdentifier = input.coverIdentifier
    ? importKey(input.coverIdentifier, "Identificatorul coperții")
    : undefined;
  const title = input.title.trim();
  const authorName = input.authorName.trim();
  if (!title || title.length > 300) throw new EditorialServiceError("Titlul este obligatoriu și poate avea maximum 300 de caractere.");
  if (authorName.length < 2 || authorName.length > 200) throw new EditorialServiceError("Autorul este obligatoriu și poate avea maximum 200 de caractere.");
  const isbn10 = optional(input.isbn10 ?? "")?.replaceAll("-", "").toUpperCase();
  const isbn13 = optional(input.isbn13 ?? "")?.replaceAll("-", "");
  if (isbn10 && !/^[0-9X]{10}$/.test(isbn10)) throw new EditorialServiceError("ISBN-10 nu este valid.");
  if (isbn13 && !/^[0-9]{13}$/.test(isbn13)) throw new EditorialServiceError("ISBN-13 nu este valid.");
  const language = input.language?.trim() || "ro";
  if (language.length < 2 || language.length > 12) throw new EditorialServiceError("Codul limbii trebuie să aibă între 2 și 12 caractere.");
  const desiredSlug = slugify(input.slug?.trim() || `${title}-${authorName}`);
  if (!desiredSlug) throw new EditorialServiceError("Slugul nu a putut fi generat.");
  const authorSlug = slugify(input.authorSlug?.trim() || authorName);
  if (!authorSlug) throw new EditorialServiceError("Slugul autorului nu a putut fi generat.");
  const strengths = input.strengths ?? [];
  const caveats = input.caveats ?? [];
  if (strengths.length > 20 || strengths.some((item) => item.length > 500)) {
    throw new EditorialServiceError("Punctele forte acceptă maximum 20 de valori, cu maximum 500 de caractere fiecare.");
  }
  if (caveats.length > 20 || caveats.some((item) => item.length > 500)) {
    throw new EditorialServiceError("Rezervele acceptă maximum 20 de valori, cu maximum 500 de caractere fiecare.");
  }
  if ((input.summary?.length ?? 0) > 10_000) throw new EditorialServiceError("Rezumatul depășește 10.000 de caractere.");
  if ((input.verdict?.length ?? 0) > 2_000) throw new EditorialServiceError("Verdictul depășește 2.000 de caractere.");
  if ((input.whyRead?.length ?? 0) > 5_000 || (input.whyNot?.length ?? 0) > 5_000) {
    throw new EditorialServiceError("Argumentele editoriale pot avea maximum 5.000 de caractere fiecare.");
  }
  if ((input.seoTitle?.length ?? 0) > 70) throw new EditorialServiceError("Titlul SEO depășește 70 de caractere.");
  if ((input.seoDescription?.length ?? 0) > 170) throw new EditorialServiceError("Descrierea SEO depășește 170 de caractere.");
  if (input.seoCanonical) {
    try {
      if (new URL(input.seoCanonical).protocol !== "https:") throw new Error("protocol");
    } catch {
      throw new EditorialServiceError("URL-ul canonical trebuie să fie un URL HTTPS valid.");
    }
  }
  const traitCodes = new Set<string>();
  for (const trait of input.traitScores ?? []) {
    const code = normalizedLookup(trait.code);
    if (traitCodes.has(code)) throw new EditorialServiceError(`Scorul de lectură „${trait.code}” este duplicat.`);
    traitCodes.add(code);
  }

  return {
    row: input.row,
    identifier,
    title,
    originalTitle: optional(input.originalTitle ?? ""),
    slug: desiredSlug,
    authorIdentifier,
    authorName,
    authorSlug,
    authorBio: optional(input.authorBio ?? ""),
    authorVerifiedFacts: optional(input.authorVerifiedFacts ?? ""),
    authorSourceNotes: optional(input.authorSourceNotes ?? ""),
    coverIdentifier,
    coverAlt: optional(input.coverAlt ?? ""),
    isbn10,
    isbn13,
    publicationYear: integerValue(input.publicationYear, "an_publicare", input.row, 1450, 3000),
    language,
    pageCount: integerValue(input.pageCount, "numar_pagini", input.row, 1, 100_000),
    summary: optional(input.summary ?? ""),
    verdict: optional(input.verdict ?? ""),
    whyRead: optional(input.whyRead ?? ""),
    whyNot: optional(input.whyNot ?? ""),
    strengths,
    caveats,
    editorialConfidence: integerValue(input.editorialConfidence, "incredere_editoriala", input.row, 0, 100, 0) ?? 0,
    genres: input.genres ?? [],
    themes: input.themes ?? [],
    moods: input.moods ?? [],
    audiences: input.audiences ?? [],
    traitScores: input.traitScores ?? [],
    seoTitle: optional(input.seoTitle ?? ""),
    seoDescription: optional(input.seoDescription ?? ""),
    seoCanonical: optional(input.seoCanonical ?? ""),
    seoIndexable: booleanValue(input.seoIndexable, false),
  };
}

function parseCsvRows(fileRows: string[][]): { rows: ParsedImportRow[]; errors: BookImportReportItem[] } {
  const headerRow = fileRows[0];
  if (!headerRow || fileRows.length < 2) throw new EditorialServiceError("Fișierul nu conține cărți de importat.");
  const headers = headerRow.map((item) => normalizedLookup(item).replaceAll("-", "_"));
  const requiredHeaders = ["identificator_carte", "titlu", "identificator_autor", "autor"];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length) throw new EditorialServiceError(`Lipsesc coloanele obligatorii: ${missingHeaders.join(", ")}.`);

  const rows: ParsedImportRow[] = [];
  const errors: BookImportReportItem[] = [];
  for (const [offset, values] of fileRows.slice(1).entries()) {
    const rowNumber = offset + 2;
    const record = Object.fromEntries(
      bookImportHeaders.map((header) => [header, values[headers.indexOf(header)] ?? ""]),
    ) as CsvRow;
    try {
      rows.push(buildRow({
        row: rowNumber,
        identifier: record.identificator_carte,
        title: record.titlu,
        originalTitle: record.titlu_original,
        slug: record.slug,
        authorIdentifier: record.identificator_autor,
        authorName: record.autor,
        authorSlug: record.slug_autor,
        authorBio: record.biografie_autor,
        authorVerifiedFacts: record.fapte_verificate_autor,
        authorSourceNotes: record.note_surse_autor,
        coverIdentifier: record.identificator_coperta,
        coverAlt: record.text_alternativ_coperta,
        isbn10: record.isbn10,
        isbn13: record.isbn13,
        publicationYear: record.an_publicare,
        language: record.limba,
        pageCount: record.numar_pagini,
        summary: record.rezumat,
        verdict: record.verdict,
        whyRead: record.de_ce_merita,
        whyNot: record.de_ce_nu,
        strengths: list(record.puncte_forte),
        caveats: list(record.rezerve),
        editorialConfidence: record.incredere_editoriala,
        genres: list(record.genuri),
        themes: list(record.teme),
        moods: list(record.atmosfere),
        audiences: list(record.audiente),
        traitScores: parseTraitString(record.scoruri_lectura, rowNumber),
        seoTitle: record.titlu_seo,
        seoDescription: record.descriere_seo,
        seoCanonical: record.canonical_seo,
        seoIndexable: record.indexabil,
      }));
    } catch (error) {
      errors.push(csvError(rowNumber, record.identificator_carte, record.titlu, error instanceof Error ? error.message : "Rând invalid."));
    }
  }
  return { rows, errors };
}

function parseJsonRows(text: string): { rows: ParsedImportRow[]; errors: BookImportReportItem[] } {
  const parsed: unknown = JSON.parse(text);
  const root = asRecord(parsed);
  const bookValues = Array.isArray(parsed) ? parsed : valueFrom(root, "books", "carti");
  if (!Array.isArray(bookValues) || !bookValues.length) throw new EditorialServiceError("Fișierul JSON trebuie să conțină un array „books”.");
  const authorCatalog = new Map<string, LooseRecord>();
  const authorValues = valueFrom(root, "authors", "autori");
  if (Array.isArray(authorValues)) {
    for (const value of authorValues) {
      const author = asRecord(value);
      const identifier = stringFrom(author, "id", "author_id", "identificator_autor");
      if (!identifier) throw new EditorialServiceError("Un autor din array-ul „authors” nu are identificator.");
      if (authorCatalog.has(identifier)) throw new EditorialServiceError(`Autorul „${identifier}” este duplicat în array-ul „authors”.`);
      authorCatalog.set(identifier, author);
    }
  }

  const rows: ParsedImportRow[] = [];
  const errors: BookImportReportItem[] = [];
  for (const [index, value] of bookValues.entries()) {
    const rowNumber = index + 1;
    const book = asRecord(value);
    const embeddedAuthor = asRecord(valueFrom(book, "author", "autor"));
    const bookAuthorReference = stringFrom(book, "author_id", "identificator_autor");
    const embeddedAuthorReference = stringFrom(embeddedAuthor, "id", "author_id", "identificator_autor");
    const authorReference = bookAuthorReference || embeddedAuthorReference;
    const author = Object.keys(embeddedAuthor).length
      ? embeddedAuthor
      : authorCatalog.get(authorReference) ?? {};
    const cover = asRecord(valueFrom(book, "cover", "coperta"));
    const editorial = asRecord(valueFrom(book, "editorial"));
    const taxonomy = asRecord(valueFrom(book, "taxonomy", "taxonomie"));
    const seo = asRecord(valueFrom(book, "seo"));
    const identifier = stringFrom(book, "id", "book_id", "identificator_carte");
    const title = stringFrom(book, "title", "titlu");
    try {
      if (bookAuthorReference && embeddedAuthorReference && bookAuthorReference !== embeddedAuthorReference) {
        throw new EditorialServiceError("Cartea conține doi identificatori diferiți pentru autor.");
      }
      rows.push(buildRow({
        row: rowNumber,
        identifier,
        title,
        originalTitle: stringFrom(book, "original_title", "originalTitle", "titlu_original"),
        slug: stringFrom(book, "slug"),
        authorIdentifier: authorReference || stringFrom(author, "id", "author_id", "identificator_autor"),
        authorName: stringFrom(author, "name", "nume") || stringFrom(book, "author_name", "autor"),
        authorSlug: stringFrom(author, "slug"),
        authorBio: stringFrom(author, "bio", "biografie"),
        authorVerifiedFacts: stringFrom(author, "verified_facts", "fapte_verificate"),
        authorSourceNotes: stringFrom(author, "source_notes", "note_surse"),
        coverIdentifier: stringFrom(cover, "id", "cover_id", "identificator_coperta") || stringFrom(book, "cover_id", "identificator_coperta"),
        coverAlt: stringFrom(cover, "alt", "alt_text", "text_alternativ") || stringFrom(book, "cover_alt", "text_alternativ_coperta"),
        isbn10: stringFrom(book, "isbn10"),
        isbn13: stringFrom(book, "isbn13"),
        publicationYear: valueFrom(book, "publication_year", "publicationYear", "an_publicare"),
        language: stringFrom(book, "language", "limba"),
        pageCount: valueFrom(book, "page_count", "pageCount", "numar_pagini"),
        summary: stringFrom(editorial, "summary", "rezumat") || stringFrom(book, "summary", "rezumat"),
        verdict: stringFrom(editorial, "verdict") || stringFrom(book, "verdict"),
        whyRead: stringFrom(editorial, "why_read", "whyRead", "de_ce_merita") || stringFrom(book, "why_read", "de_ce_merita"),
        whyNot: stringFrom(editorial, "why_not", "whyNot", "de_ce_nu") || stringFrom(book, "why_not", "de_ce_nu"),
        strengths: stringList(valueFrom(editorial, "strengths", "puncte_forte") ?? valueFrom(book, "strengths", "puncte_forte")),
        caveats: stringList(valueFrom(editorial, "caveats", "rezerve") ?? valueFrom(book, "caveats", "rezerve")),
        editorialConfidence: valueFrom(editorial, "confidence", "incredere_editoriala") ?? valueFrom(book, "editorial_confidence", "incredere_editoriala"),
        genres: stringList(valueFrom(taxonomy, "genres", "genuri") ?? valueFrom(book, "genres", "genuri")),
        themes: stringList(valueFrom(taxonomy, "themes", "teme") ?? valueFrom(book, "themes", "teme")),
        moods: stringList(valueFrom(taxonomy, "moods", "atmosfere") ?? valueFrom(book, "moods", "atmosfere")),
        audiences: stringList(valueFrom(taxonomy, "audiences", "audiente") ?? valueFrom(book, "audiences", "audiente")),
        traitScores: parseTraitJson(valueFrom(book, "trait_scores", "scoruri_lectura"), rowNumber),
        seoTitle: stringFrom(seo, "title", "titlu"),
        seoDescription: stringFrom(seo, "description", "descriere"),
        seoCanonical: stringFrom(seo, "canonical"),
        seoIndexable: valueFrom(seo, "indexable", "indexabil"),
      }));
    } catch (error) {
      errors.push(csvError(rowNumber, identifier, title, error instanceof Error ? error.message : "Obiect JSON invalid."));
    }
  }
  return { rows, errors };
}

function validateBatch(rows: ParsedImportRow[]) {
  const errors: BookImportReportItem[] = [];
  const booksSeen = new Set<string>();
  const coversSeen = new Set<string>();
  const slugsSeen = new Set<string>();
  const isbnsSeen = new Set<string>();
  const bookSignaturesSeen = new Set<string>();
  const authorsSeen = new Map<string, string>();

  for (const row of rows) {
    if (booksSeen.has(row.identifier)) errors.push(csvError(row.row, row.identifier, row.title, "Identificator de carte duplicat în fișier."));
    booksSeen.add(row.identifier);
    if (row.coverIdentifier) {
      if (coversSeen.has(row.coverIdentifier)) errors.push(csvError(row.row, row.identifier, row.title, "Identificator de copertă folosit la mai multe cărți."));
      coversSeen.add(row.coverIdentifier);
    }
    if (slugsSeen.has(row.slug)) errors.push(csvError(row.row, row.identifier, row.title, "Slug duplicat în fișier."));
    slugsSeen.add(row.slug);
    const bookSignature = `${normalizedLookup(row.title)}|${row.authorIdentifier}`;
    if (bookSignaturesSeen.has(bookSignature)) {
      errors.push(csvError(row.row, row.identifier, row.title, "Aceeași carte apare de mai multe ori pentru același autor."));
    }
    bookSignaturesSeen.add(bookSignature);
    for (const isbn of [row.isbn10, row.isbn13].filter(Boolean) as string[]) {
      if (isbnsSeen.has(isbn)) errors.push(csvError(row.row, row.identifier, row.title, `ISBN duplicat în fișier: ${isbn}.`));
      isbnsSeen.add(isbn);
    }
    const authorSignature = JSON.stringify([
      normalizedLookup(row.authorName),
      row.authorSlug,
      row.authorBio ?? "",
      row.authorVerifiedFacts ?? "",
      row.authorSourceNotes ?? "",
    ]);
    const knownAuthorSignature = authorsSeen.get(row.authorIdentifier);
    if (knownAuthorSignature && knownAuthorSignature !== authorSignature) {
      errors.push(csvError(row.row, row.identifier, row.title, `Identificatorul de autor „${row.authorIdentifier}” are date diferite în mai multe cărți.`));
    } else {
      authorsSeen.set(row.authorIdentifier, authorSignature);
    }
  }
  return errors;
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

export async function importBooksFromFile(
  file: File,
  actorUserId: string,
  importOptions: { validateOnly?: boolean } = {},
): Promise<BookImportActionState> {
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension !== "csv" && extension !== "json") {
    return { status: "error", message: "Încarcă un fișier CSV sau JSON bazat pe modelele disponibile.", imported: [], skipped: [], errors: [] };
  }
  if (file.size === 0 || file.size > MAX_IMPORT_BYTES) {
    return { status: "error", message: "Fișierul trebuie să aibă maximum 4 MB.", imported: [], skipped: [], errors: [] };
  }

  let parsed: { rows: ParsedImportRow[]; errors: BookImportReportItem[] };
  try {
    const text = await file.text();
    parsed = extension === "json" ? parseJsonRows(text) : parseCsvRows(parseCsv(text));
    if (parsed.rows.length > MAX_IMPORT_ROWS) throw new EditorialServiceError(`Importă maximum ${MAX_IMPORT_ROWS} de cărți într-un singur fișier.`);
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Fișierul nu a putut fi citit.", imported: [], skipped: [], errors: [] };
  }

  const batchErrors = [...parsed.errors, ...validateBatch(parsed.rows)];
  if (batchErrors.length) {
    return { status: "error", message: "Importul nu a pornit. Corectează toate conflictele indicate.", imported: [], skipped: [], errors: batchErrors };
  }

  const db = getDb();
  const options = await getBookFormOptions(db);
  const genreIndex = taxonomyMap(options.genres);
  const themeIndex = taxonomyMap(options.themes);
  const moodIndex = taxonomyMap(options.moods);
  const audienceIndex = taxonomyMap(options.audiences);
  const traitIndex = new Map(options.traits.flatMap((trait) => [
    [normalizedLookup(trait.code), trait.id] as const,
    [normalizedLookup(trait.name), trait.id] as const,
  ]));
  const validationErrors: BookImportReportItem[] = [];
  const prepared = parsed.rows.flatMap((row) => {
    try {
      const traitScores = row.traitScores.map((trait) => {
        const traitId = traitIndex.get(normalizedLookup(trait.code));
        if (!traitId) throw new EditorialServiceError(`Rândul ${row.row}: trăsătura „${trait.code}” nu există în admin.`);
        return { traitId, score: trait.score, confidence: trait.confidence };
      });
      return [{
        row,
        genreIds: taxonomyIds(row.genres, genreIndex, "Genuri", row),
        themeIds: taxonomyIds(row.themes, themeIndex, "Teme", row),
        moodIds: taxonomyIds(row.moods, moodIndex, "Atmosfere", row),
        audienceIds: taxonomyIds(row.audiences, audienceIndex, "Audiențe", row),
        traitScores,
      }];
    } catch (error) {
      validationErrors.push(csvError(row.row, row.identifier, row.title, error instanceof Error ? error.message : "Opțiune invalidă."));
      return [];
    }
  });
  if (validationErrors.length) {
    return { status: "error", message: "Importul nu a pornit. Corectează opțiunile indicate.", imported: [], skipped: [], errors: validationErrors };
  }

  const coverKeys = [...new Set(parsed.rows.map((row) => row.coverIdentifier).filter(Boolean) as string[])];
  const [authorRows, coverRows, existingBookRows, existingEditionRows] = await Promise.all([
    db.select({ id: authors.id, name: authors.name, slug: authors.slug, importKey: authors.importKey }).from(authors).where(and(isNull(authors.deletedAt), or(eq(authors.status, "draft"), eq(authors.status, "needs_review"), eq(authors.status, "published")))),
    coverKeys.length
      ? db.select({ id: mediaAssets.id, importKey: mediaAssets.importKey }).from(mediaAssets).where(and(inArray(mediaAssets.importKey, coverKeys), eq(mediaAssets.status, "active"), isNull(mediaAssets.deletedAt)))
      : Promise.resolve([]),
    db.select({ id: books.id, title: books.title, slug: books.slug, importKey: books.importKey, authorImportKey: authors.importKey, authorName: authors.name })
      .from(books)
      .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
      .where(isNull(books.deletedAt)),
    db.select({ isbn10: bookEditions.isbn10, isbn13: bookEditions.isbn13, coverImportKey: bookEditions.coverImportKey }).from(bookEditions),
  ]);

  const authorByImportKey = new Map(authorRows.flatMap((author) => author.importKey ? [[author.importKey, author] as const] : []));
  const authorsByName = new Map<string, typeof authorRows>();
  for (const author of authorRows) {
    const key = normalizedLookup(author.name);
    authorsByName.set(key, [...(authorsByName.get(key) ?? []), author]);
  }
  const authorBySlug = new Map(authorRows.map((author) => [author.slug, author]));
  const coverIndex = new Map(coverRows.flatMap((row) => row.importKey ? [[row.importKey, row.id] as const] : []));
  const existingBooks = new Map(existingBookRows.flatMap((book) => book.importKey ? [[book.importKey, book] as const] : []));
  const existingSlugs = new Map(existingBookRows.map((book) => [book.slug, book.id]));
  const existingBookSignatures = new Map<string, string>();
  for (const book of existingBookRows) {
    const titleKey = normalizedLookup(book.title);
    existingBookSignatures.set(`${titleKey}|name:${normalizedLookup(book.authorName)}`, book.id);
    if (book.authorImportKey) existingBookSignatures.set(`${titleKey}|id:${book.authorImportKey}`, book.id);
  }
  const existingIsbns = new Set(existingEditionRows.flatMap((edition) => [edition.isbn10, edition.isbn13]).filter(Boolean) as string[]);
  const existingCoverKeys = new Set(existingEditionRows.map((edition) => edition.coverImportKey).filter(Boolean) as string[]);
  const imported: BookImportReportItem[] = [];
  const skipped: BookImportReportItem[] = [];
  const errors: BookImportReportItem[] = [];

  for (const item of prepared) {
    const { row } = item;
    const existingBook = existingBooks.get(row.identifier);
    if (existingBook) {
      const sameIdentity = normalizedLookup(existingBook.title) === normalizedLookup(row.title)
        && (!existingBook.authorImportKey || existingBook.authorImportKey === row.authorIdentifier);
      const target = { ...csvError(row.row, row.identifier, row.title, sameIdentity ? "Cartea a fost deja importată; nu a fost suprascrisă." : "Conflict: identificatorul există la altă carte sau la alt autor."), bookId: existingBook.id };
      (sameIdentity ? skipped : errors).push(target);
      continue;
    }
    const duplicateIsbn = [row.isbn10, row.isbn13].find((isbn) => isbn && existingIsbns.has(isbn));
    if (duplicateIsbn) {
      errors.push(csvError(row.row, row.identifier, row.title, `Conflict: ISBN ${duplicateIsbn} există deja.`));
      continue;
    }
    if (existingSlugs.has(row.slug)) {
      errors.push(csvError(row.row, row.identifier, row.title, "Conflict: slugul este deja folosit de altă carte."));
      continue;
    }
    const titleKey = normalizedLookup(row.title);
    if (
      existingBookSignatures.has(`${titleKey}|id:${row.authorIdentifier}`)
      || existingBookSignatures.has(`${titleKey}|name:${normalizedLookup(row.authorName)}`)
    ) {
      errors.push(csvError(row.row, row.identifier, row.title, "Conflict: aceeași carte există deja pentru acest autor."));
      continue;
    }
    if (row.coverIdentifier && existingCoverKeys.has(row.coverIdentifier)) {
      errors.push(csvError(row.row, row.identifier, row.title, "Conflict: identificatorul coperții este deja rezervat altei cărți."));
      continue;
    }

    try {
      let author = authorByImportKey.get(row.authorIdentifier);
      if (author && normalizedLookup(author.name) !== normalizedLookup(row.authorName)) {
        throw new EditorialServiceError(`Conflict: identificatorul autorului „${row.authorIdentifier}” aparține profilului ${author.name}.`);
      }
      if (!author) {
        const bySlug = authorBySlug.get(row.authorSlug);
        const nameMatches = authorsByName.get(normalizedLookup(row.authorName)) ?? [];
        if (!bySlug && nameMatches.length > 1) throw new EditorialServiceError("Există mai mulți autori cu același nume; folosește slugul profilului corect.");
        const byName = nameMatches.length === 1 ? nameMatches[0] : undefined;
        if (bySlug && byName && bySlug.id !== byName.id) throw new EditorialServiceError("Numele și slugul autorului indică profiluri diferite.");
        author = bySlug ?? byName;
        if (author?.importKey && author.importKey !== row.authorIdentifier) {
          throw new EditorialServiceError(`Autorul existent are deja identificatorul „${author.importKey}”.`);
        }
        if (author) {
          if (!importOptions.validateOnly) {
            await assignAuthorImportKey(author.id, row.authorIdentifier, actorUserId);
          }
          author = { ...author, importKey: row.authorIdentifier };
        } else {
          const authorId = importOptions.validateOnly
            ? `pending-${row.authorIdentifier}`
            : await saveAuthor({
                name: row.authorName,
                importKey: row.authorIdentifier,
                slug: row.authorSlug,
                bio: row.authorBio,
                verifiedFacts: row.authorVerifiedFacts,
                sourceNotes: row.authorSourceNotes ?? "Creat automat prin importul de cărți.",
                status: "draft",
              }, actorUserId);
          author = { id: authorId, name: row.authorName, slug: row.authorSlug, importKey: row.authorIdentifier };
          authorBySlug.set(row.authorSlug, author);
          const nameKey = normalizedLookup(row.authorName);
          authorsByName.set(nameKey, [...(authorsByName.get(nameKey) ?? []), author]);
        }
        authorByImportKey.set(row.authorIdentifier, author);
      }

      const coverAssetId = row.coverIdentifier ? coverIndex.get(row.coverIdentifier) : undefined;
      if (importOptions.validateOnly) {
        const pendingBookId = `pending-${row.identifier}`;
        existingBooks.set(row.identifier, { id: pendingBookId, title: row.title, slug: row.slug, importKey: row.identifier, authorImportKey: row.authorIdentifier, authorName: row.authorName });
        existingSlugs.set(row.slug, pendingBookId);
        existingBookSignatures.set(`${titleKey}|id:${row.authorIdentifier}`, pendingBookId);
        existingBookSignatures.set(`${titleKey}|name:${normalizedLookup(row.authorName)}`, pendingBookId);
        if (row.isbn10) existingIsbns.add(row.isbn10);
        if (row.isbn13) existingIsbns.add(row.isbn13);
        if (row.coverIdentifier) existingCoverKeys.add(row.coverIdentifier);
        imported.push(csvError(row.row, row.identifier, row.title, "Pregătită pentru import; autorul și opțiunile au fost validate."));
        continue;
      }
      const input: BookInput = {
        title: row.title,
        importKey: row.identifier,
        originalTitle: row.originalTitle,
        slug: row.slug,
        authorId: author.id,
        summary: row.summary,
        verdict: row.verdict,
        whyRead: row.whyRead,
        whyNot: row.whyNot,
        strengths: row.strengths,
        caveats: row.caveats,
        status: "draft",
        editorialConfidence: row.editorialConfidence,
        edition: {
          isbn10: row.isbn10,
          isbn13: row.isbn13,
          publicationYear: row.publicationYear,
          language: row.language,
          pageCount: row.pageCount,
          coverImportKey: row.coverIdentifier,
          coverAssetId,
          active: true,
        },
        genreIds: item.genreIds,
        themeIds: item.themeIds,
        moodIds: item.moodIds,
        audienceIds: item.audienceIds,
        traitScores: item.traitScores,
        seo: {
          title: row.seoTitle,
          description: row.seoDescription,
          canonical: row.seoCanonical,
          indexable: row.seoIndexable,
        },
      };
      const bookId = await saveBook(input, actorUserId);
      existingBooks.set(row.identifier, { id: bookId, title: row.title, slug: row.slug, importKey: row.identifier, authorImportKey: row.authorIdentifier, authorName: row.authorName });
      existingSlugs.set(row.slug, bookId);
      existingBookSignatures.set(`${titleKey}|id:${row.authorIdentifier}`, bookId);
      existingBookSignatures.set(`${titleKey}|name:${normalizedLookup(row.authorName)}`, bookId);
      if (row.isbn10) existingIsbns.add(row.isbn10);
      if (row.isbn13) existingIsbns.add(row.isbn13);
      if (row.coverIdentifier) existingCoverKeys.add(row.coverIdentifier);
      imported.push({
        row: row.row,
        identifier: row.identifier,
        title: row.title,
        bookId,
        message: coverAssetId
          ? "Creată ca ciornă, cu autorul și coperta asociate."
          : row.coverIdentifier
            ? `Creată ca ciornă; coperta „${row.coverIdentifier}” va fi asociată după încărcare.`
            : "Creată ca ciornă, fără copertă.",
      });
    } catch (error) {
      errors.push(csvError(row.row, row.identifier, row.title, error instanceof Error ? error.message : "Cartea nu a putut fi creată."));
    }
  }

  const processedIdentifiers = new Set([...imported, ...skipped].map((item) => item.identifier));
  return {
    status: errors.length ? "error" : "success",
    message: importOptions.validateOnly
      ? `${imported.length} cărți pregătite, ${skipped.length} deja existente, ${errors.length} conflicte.`
      : `${imported.length} cărți importate, ${skipped.length} omise, ${errors.length} cu erori.`,
    imported,
    skipped,
    errors,
    covers: parsed.rows.flatMap((row) => row.coverIdentifier && processedIdentifiers.has(row.identifier)
      ? [{ identifier: row.coverIdentifier, altText: row.coverAlt || `Coperta cărții ${row.title}` }]
      : []),
  };
}
