import "server-only";

import { isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { authors } from "@/db/schema";
import { slugify } from "@/lib/slug";

import { EditorialServiceError } from "./action-state";
import { assignAuthorImportKey, saveAuthor } from "./author-service";
import type { AuthorImportActionState, AuthorImportReportItem } from "./author-import-types";

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_ROWS = 500;

export const authorImportHeaders = [
  "identificator_autor",
  "nume",
  "slug",
  "biografie",
  "fapte_verificate",
  "note_surse",
] as const;

type Header = (typeof authorImportHeaders)[number];
type CsvRow = Record<Header, string>;

type ParsedAuthorRow = {
  row: number;
  identifier: string;
  name: string;
  slug: string;
  bio?: string;
  verifiedFacts?: string;
  sourceNotes?: string;
};

function report(row: number, identifier: string, name: string, message: string): AuthorImportReportItem {
  return { row, identifier: identifier || `rand-${row}`, name: name || "—", message };
}

function normalizeLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
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

function parseRows(fileRows: string[][]): { rows: ParsedAuthorRow[]; errors: AuthorImportReportItem[] } {
  const headerRow = fileRows[0];
  if (!headerRow || fileRows.length < 2) throw new EditorialServiceError("Fișierul nu conține autori de importat.");
  const headers = headerRow.map((item) => normalizeLookup(item).replaceAll("-", "_"));
  const missingHeaders = authorImportHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    throw new EditorialServiceError(`Lipsesc coloanele: ${missingHeaders.join(", ")}. Descarcă din nou fișierul-model.`);
  }

  const rows: ParsedAuthorRow[] = [];
  const errors: AuthorImportReportItem[] = [];
  const identifiers = new Set<string>();

  for (const [offset, values] of fileRows.slice(1).entries()) {
    const rowNumber = offset + 2;
    const record = Object.fromEntries(
      authorImportHeaders.map((header) => [header, values[headers.indexOf(header)] ?? ""]),
    ) as CsvRow;
    const identifier = slugify(record.identificator_autor);
    const name = record.nume.trim();

    try {
      if (!identifier || identifier.length < 2) throw new EditorialServiceError("Identificatorul autorului este obligatoriu.");
      if (identifiers.has(identifier)) throw new EditorialServiceError("Identificator duplicat în fișier.");
      if (name.length < 2 || name.length > 200) throw new EditorialServiceError("Numele este obligatoriu și poate avea maximum 200 de caractere.");
      const desiredSlug = slugify(optional(record.slug) ?? name);
      if (!desiredSlug) throw new EditorialServiceError("Slugul nu a putut fi generat.");

      identifiers.add(identifier);
      rows.push({
        row: rowNumber,
        identifier,
        name,
        slug: desiredSlug,
        bio: optional(record.biografie),
        verifiedFacts: optional(record.fapte_verificate),
        sourceNotes: optional(record.note_surse),
      });
    } catch (error) {
      errors.push(report(rowNumber, identifier, name, error instanceof Error ? error.message : "Rând invalid."));
    }
  }

  return { rows, errors };
}

export async function importAuthorsFromCsv(file: File, actorUserId: string): Promise<AuthorImportActionState> {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { status: "error", message: "Încarcă un fișier CSV bazat pe modelul disponibil.", imported: [], skipped: [], errors: [] };
  }
  if (file.size === 0 || file.size > MAX_IMPORT_BYTES) {
    return { status: "error", message: "Fișierul trebuie să aibă maximum 2 MB.", imported: [], skipped: [], errors: [] };
  }

  let parsed: ReturnType<typeof parseRows>;
  try {
    const rawRows = parseCsv(await file.text());
    if (rawRows.length - 1 > MAX_IMPORT_ROWS) {
      throw new EditorialServiceError(`Importă maximum ${MAX_IMPORT_ROWS} de autori într-un singur fișier.`);
    }
    parsed = parseRows(rawRows);
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Fișierul nu a putut fi citit.", imported: [], skipped: [], errors: [] };
  }

  if (parsed.errors.length) {
    return { status: "error", message: "Importul nu a pornit. Corectează rândurile indicate.", imported: [], skipped: [], errors: parsed.errors };
  }

  const db = getDb();
  const existingRows = await db
    .select({ id: authors.id, name: authors.name, slug: authors.slug, importKey: authors.importKey })
    .from(authors)
    .where(isNull(authors.deletedAt));
  const byImportKey = new Map(existingRows.flatMap((author) => author.importKey ? [[author.importKey, author] as const] : []));
  const bySlug = new Map(existingRows.map((author) => [author.slug, author]));
  const byName = new Map<string, typeof existingRows>();
  for (const author of existingRows) {
    const key = normalizeLookup(author.name);
    byName.set(key, [...(byName.get(key) ?? []), author]);
  }
  const imported: AuthorImportReportItem[] = [];
  const skipped: AuthorImportReportItem[] = [];
  const errors: AuthorImportReportItem[] = [];

  for (const row of parsed.rows) {
    const existingByKey = byImportKey.get(row.identifier);
    if (existingByKey) {
      skipped.push({ ...report(row.row, row.identifier, row.name, "Autorul există deja cu același identificator."), authorId: existingByKey.id });
      continue;
    }

    const existingBySlug = bySlug.get(row.slug);
    const existingNameMatches = byName.get(normalizeLookup(row.name)) ?? [];
    if (!existingBySlug && existingNameMatches.length > 1) {
      errors.push(report(row.row, row.identifier, row.name, "Există mai mulți autori cu acest nume. Completează slugul exact pentru profilul dorit."));
      continue;
    }
    const existingByName = existingNameMatches.length === 1 ? existingNameMatches[0] : undefined;
    if (existingBySlug && existingByName && existingBySlug.id !== existingByName.id) {
      errors.push(report(row.row, row.identifier, row.name, "Numele și slugul indică doi autori diferiți. Verifică rândul manual."));
      continue;
    }

    const existing = existingBySlug ?? existingByName;
    if (existing?.importKey && existing.importKey !== row.identifier) {
      errors.push(report(row.row, row.identifier, row.name, `Autorul existent are deja identificatorul „${existing.importKey}”.`));
      continue;
    }

    try {
      if (existing) {
        await assignAuthorImportKey(existing.id, row.identifier, actorUserId);
        const indexed = { ...existing, importKey: row.identifier };
        byImportKey.set(row.identifier, indexed);
        imported.push({ ...report(row.row, row.identifier, row.name, "Identificator asociat profilului existent; datele profilului nu au fost suprascrise."), authorId: existing.id });
        continue;
      }

      const authorId = await saveAuthor({
        name: row.name,
        importKey: row.identifier,
        slug: row.slug,
        bio: row.bio,
        verifiedFacts: row.verifiedFacts,
        sourceNotes: row.sourceNotes,
        status: "draft",
      }, actorUserId);
      const indexed = { id: authorId, name: row.name, slug: row.slug, importKey: row.identifier };
      byImportKey.set(row.identifier, indexed);
      bySlug.set(row.slug, indexed);
      const nameKey = normalizeLookup(row.name);
      byName.set(nameKey, [...(byName.get(nameKey) ?? []), indexed]);
      imported.push({ ...report(row.row, row.identifier, row.name, "Autor creat ca ciornă."), authorId });
    } catch (error) {
      errors.push(report(row.row, row.identifier, row.name, error instanceof Error ? error.message : "Autorul nu a putut fi creat."));
    }
  }

  return {
    status: errors.length ? "error" : "success",
    message: `${imported.length} autori procesați, ${skipped.length} omiși, ${errors.length} cu erori.`,
    imported,
    skipped,
    errors,
  };
}
