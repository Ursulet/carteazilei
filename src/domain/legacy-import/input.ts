import "server-only";

import { z } from "zod";

const idSchema = z.string().trim().min(1).max(300);
const shortText = z.string().trim().min(1).max(500);
const optionalText = z.string().trim().min(1).max(20_000).optional();
const optionalUrl = z.url().optional();
const optionalLegacyUrl = z.string().trim().refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}, "URL-ul legacy trebuie să fie HTTP(S) sau o cale absolută.").optional();

export const legacyAuthorSchema = z.object({
  legacyId: idSchema,
  name: shortText,
  slug: z.string().trim().min(1).max(300).optional(),
  bio: optionalText,
  legacyUrl: optionalLegacyUrl,
});

export const legacyMediaSchema = z.object({
  legacyId: idSchema,
  filePath: z.string().trim().min(1).max(2_000),
  altText: z.string().trim().min(5).max(500),
  attribution: z.string().trim().min(1).max(500).optional(),
  sourceLabel: z.string().trim().min(1).max(300).optional(),
  sourceUrl: optionalUrl,
});

export const legacyBookSchema = z.object({
  legacyId: idSchema,
  title: shortText,
  slug: z.string().trim().min(1).max(300).optional(),
  subtitle: z.string().trim().min(1).max(1_000).optional(),
  originalTitle: z.string().trim().min(1).max(1_000).optional(),
  authorLegacyId: idSchema.optional(),
  authorName: shortText.optional(),
  summary: optionalText,
  verdict: z.string().trim().min(1).max(2_000).optional(),
  isbn10: z.string().trim().regex(/^[0-9X]{10}$/).optional(),
  isbn13: z.string().trim().regex(/^[0-9]{13}$/).optional(),
  publisher: z.string().trim().min(1).max(500).optional(),
  publicationYear: z.number().int().min(1450).max(3000).optional(),
  language: z.string().trim().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/).default("ro"),
  pageCount: z.number().int().positive().max(100_000).optional(),
  coverLegacyId: idSchema.optional(),
  genres: z.array(shortText).max(100).default([]),
  themes: z.array(shortText).max(100).default([]),
  moods: z.array(shortText).max(100).default([]),
  purchaseUrls: z.array(z.url()).max(30).default([]),
  legacyUrl: optionalLegacyUrl,
});

export const legacyReviewSchema = z.object({
  legacyId: idSchema,
  bookLegacyId: idSchema.optional(),
  bookSlug: z.string().trim().min(1).max(300).optional(),
  reviewerName: z.string().trim().min(1).max(500).optional(),
  body: z.string().trim().min(1).max(100_000),
  sourceLabel: z.string().trim().min(1).max(500).optional(),
  sourceUrl: optionalUrl,
  originVerified: z.boolean().default(false),
  verificationNote: z.string().trim().min(1).max(2_000).optional(),
});

export const legacyDailyFeatureSchema = z.object({
  legacyId: idSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bookLegacyId: idSchema.optional(),
  bookSlug: z.string().trim().min(1).max(300).optional(),
  headline: z.string().trim().min(1).max(1_000).optional(),
  whyToday: optionalText,
  audienceNote: optionalText,
  caveat: optionalText,
  fitPoints: z.array(z.string().trim().min(1).max(1_000)).max(20).default([]),
  legacyUrl: optionalLegacyUrl,
});

export type LegacyAuthor = z.infer<typeof legacyAuthorSchema>;
export type LegacyMedia = z.infer<typeof legacyMediaSchema>;
export type LegacyBook = z.infer<typeof legacyBookSchema>;
export type LegacyReview = z.infer<typeof legacyReviewSchema>;
export type LegacyDailyFeature = z.infer<typeof legacyDailyFeatureSchema>;

export type NormalizedLegacyExport = {
  authors: LegacyAuthor[];
  media: LegacyMedia[];
  books: LegacyBook[];
  reviews: LegacyReview[];
  dailyFeatures: LegacyDailyFeature[];
  ignoredCounts: { displaySettings: number; quizTags: number; siteSettings: number };
};

export type InvalidLegacyRecord = {
  sourceType: "author" | "media" | "book" | "review" | "daily_feature";
  index: number;
  legacyId?: string;
  issues: string[];
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as UnknownRecord : undefined;
}

function first(record: UnknownRecord, keys: string[]) {
  for (const key of keys) if (record[key] !== undefined && record[key] !== null && record[key] !== "") return record[key];
  return undefined;
}

function textValue(value: unknown) {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function booleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true" || value === "yes" || value === "da") return true;
  if (value === 0 || value === "0" || value === "false" || value === "no" || value === "nu") return false;
  return undefined;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => textValue(asRecord(item)?.name ?? item) ?? []).filter(Boolean);
  const text = textValue(value);
  return text ? text.split(/[,|;]/).map((item) => item.trim()).filter(Boolean) : [];
}

function collection(record: UnknownRecord, keys: string[]) {
  const value = first(record, keys);
  if (Array.isArray(value)) return value;
  const nested = asRecord(value);
  return nested ? Object.values(nested) : [];
}

function normalizeAuthor(record: UnknownRecord) {
  return {
    legacyId: textValue(first(record, ["legacyId", "id", "author_id", "ID"])),
    name: textValue(first(record, ["name", "author_name", "nume", "title"])),
    slug: textValue(first(record, ["slug", "author_slug"])),
    bio: textValue(first(record, ["bio", "biography", "description", "descriere"])),
    legacyUrl: textValue(first(record, ["legacyUrl", "url", "permalink"])),
  };
}

function normalizeMedia(record: UnknownRecord) {
  return {
    legacyId: textValue(first(record, ["legacyId", "id", "media_id", "attachment_id", "ID"])),
    filePath: textValue(first(record, ["filePath", "file", "path", "local_path"])),
    altText: textValue(first(record, ["altText", "alt_text", "alt", "description"])),
    attribution: textValue(first(record, ["attribution", "credit", "copyright"])),
    sourceLabel: textValue(first(record, ["sourceLabel", "source", "origin"])),
    sourceUrl: textValue(first(record, ["sourceUrl", "source_url", "url", "original_url"])),
  };
}

function normalizeBook(record: UnknownRecord) {
  const author = asRecord(first(record, ["author", "autor"]));
  const edition = asRecord(first(record, ["edition", "editie"])) ?? record;
  const offers = collection(record, ["offers", "purchase_links", "buy_links"]);
  const directPurchase = textValue(first(record, ["purchaseUrl", "purchase_url", "buy_url", "shop_url"]));
  return {
    legacyId: textValue(first(record, ["legacyId", "id", "book_id", "ID"])),
    title: textValue(first(record, ["title", "book_title", "name", "titlu"])),
    slug: textValue(first(record, ["slug", "book_slug"])),
    subtitle: textValue(first(record, ["subtitle", "subtitlu"])),
    originalTitle: textValue(first(record, ["originalTitle", "original_title"])),
    authorLegacyId: textValue(first(record, ["authorLegacyId", "author_id", "autor_id"]) ?? first(author ?? {}, ["id", "legacyId"])),
    authorName: textValue(first(record, ["authorName", "author_name", "autor"]) ?? first(author ?? {}, ["name", "nume"])),
    summary: textValue(first(record, ["summary", "description", "synopsis", "rezumat"])),
    verdict: textValue(first(record, ["verdict", "short_verdict", "recommendation"])),
    isbn10: textValue(first(edition, ["isbn10", "isbn_10"]))?.replace(/[-\s]/g, "").toUpperCase(),
    isbn13: textValue(first(edition, ["isbn13", "isbn_13", "isbn"]))?.replace(/[-\s]/g, ""),
    publisher: textValue(first(edition, ["publisher", "editura"])),
    publicationYear: numberValue(first(edition, ["publicationYear", "publication_year", "year", "an"])),
    language: (textValue(first(edition, ["language", "limba"])) ?? "ro").toLowerCase().replace(/-([a-z]{2})$/, (_, region: string) => `-${region.toUpperCase()}`),
    pageCount: numberValue(first(edition, ["pageCount", "page_count", "pages", "pagini"])),
    coverLegacyId: textValue(first(record, ["coverLegacyId", "cover_id", "image_id", "thumbnail_id"])),
    genres: stringList(first(record, ["genres", "genre", "genuri"])),
    themes: stringList(first(record, ["themes", "theme", "teme"])),
    moods: stringList(first(record, ["moods", "mood", "stari", "needs"])),
    purchaseUrls: [directPurchase, ...offers.map((offer) => textValue(first(asRecord(offer) ?? {}, ["url", "purchaseUrl", "purchase_url"])))].filter((url): url is string => Boolean(url)),
    legacyUrl: textValue(first(record, ["legacyUrl", "url", "permalink"])),
  };
}

function normalizeReview(record: UnknownRecord) {
  const reviewer = asRecord(first(record, ["reviewer", "user", "autor"]));
  return {
    legacyId: textValue(first(record, ["legacyId", "id", "review_id", "comment_id", "ID"])),
    bookLegacyId: textValue(first(record, ["bookLegacyId", "book_id", "post_id"])),
    bookSlug: textValue(first(record, ["bookSlug", "book_slug"])),
    reviewerName: textValue(first(record, ["reviewerName", "reviewer_name", "author_name", "name"]) ?? first(reviewer ?? {}, ["name", "display_name"])),
    body: textValue(first(record, ["body", "review", "content", "text", "comment_content"])),
    sourceLabel: textValue(first(record, ["sourceLabel", "source", "origin"])),
    sourceUrl: textValue(first(record, ["sourceUrl", "source_url", "url", "permalink"])),
    originVerified: booleanValue(first(record, ["originVerified", "origin_verified", "verified"])) ?? false,
    verificationNote: textValue(first(record, ["verificationNote", "verification_note", "evidence"])),
  };
}

function normalizeDailyFeature(record: UnknownRecord) {
  return {
    legacyId: textValue(first(record, ["legacyId", "id", "feature_id", "ID"])),
    date: textValue(first(record, ["date", "feature_date", "published_date"]))?.slice(0, 10),
    bookLegacyId: textValue(first(record, ["bookLegacyId", "book_id", "post_id"])),
    bookSlug: textValue(first(record, ["bookSlug", "book_slug"])),
    headline: textValue(first(record, ["headline", "title", "titlu"])),
    whyToday: textValue(first(record, ["whyToday", "why_today", "reason", "motiv"])),
    audienceNote: textValue(first(record, ["audienceNote", "audience_note"])),
    caveat: textValue(first(record, ["caveat", "warning"])),
    fitPoints: stringList(first(record, ["fitPoints", "fit_points", "reasons"])),
    legacyUrl: textValue(first(record, ["legacyUrl", "url", "permalink"])),
  };
}

function parseCollection<T>(
  rows: unknown[],
  sourceType: InvalidLegacyRecord["sourceType"],
  normalize: (record: UnknownRecord) => unknown,
  schema: z.ZodType<T>,
) {
  const accepted: T[] = [];
  const rejected: InvalidLegacyRecord[] = [];
  rows.forEach((row, index) => {
    const record = asRecord(row);
    const normalized = record ? normalize(record) : row;
    const parsed = schema.safeParse(normalized);
    if (parsed.success) accepted.push(parsed.data);
    else rejected.push({
      sourceType,
      index,
      legacyId: record ? textValue(first(record, ["legacyId", "id", "ID"])) : undefined,
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "record"}: ${issue.message}`),
    });
  });
  return { accepted, rejected };
}

export function normalizeLegacyExport(raw: unknown): { data: NormalizedLegacyExport; invalid: InvalidLegacyRecord[] } {
  const root = asRecord(raw);
  if (!root) throw new Error("Exportul legacy trebuie să fie un obiect JSON.");
  const payload = asRecord(root.data) ?? root;
  const authors = parseCollection(collection(payload, ["authors", "autori"]), "author", normalizeAuthor, legacyAuthorSchema);
  const media = parseCollection(collection(payload, ["media", "images", "covers", "attachments"]), "media", normalizeMedia, legacyMediaSchema);
  const books = parseCollection(collection(payload, ["books", "carti"]), "book", normalizeBook, legacyBookSchema);
  const reviews = parseCollection(collection(payload, ["reviews", "recenzii", "comments", "testimonials"]), "review", normalizeReview, legacyReviewSchema);
  const dailyFeatures = parseCollection(collection(payload, ["dailyFeatures", "daily_features", "cartea_zilei", "featured_history"]), "daily_feature", normalizeDailyFeature, legacyDailyFeatureSchema);

  return {
    data: {
      authors: authors.accepted,
      media: media.accepted,
      books: books.accepted,
      reviews: reviews.accepted,
      dailyFeatures: dailyFeatures.accepted,
      ignoredCounts: {
        displaySettings: collection(payload, ["displaySettings", "display_settings"]).length,
        quizTags: collection(payload, ["quizTags", "quiz_tags", "tags"]).length,
        siteSettings: Object.keys(asRecord(first(payload, ["siteSettings", "site_settings", "settings"])) ?? {}).length,
      },
    },
    invalid: [...authors.rejected, ...media.rejected, ...books.rejected, ...reviews.rejected, ...dailyFeatures.rejected],
  };
}
