import { z } from "zod";

import {
  linesValue,
  nullableInteger,
  optionalStringValue,
  slugSchema,
  stringValue,
  stringValues,
  zodFieldErrors,
} from "./form-data";
import { EditorialServiceError } from "./action-state";
import { slugify } from "@/lib/slug";

const bookStatusSchema = z.enum([
  "draft",
  "needs_review",
  "ready",
  "published",
  "archived",
]);

const bookInputSchema = z.object({
  title: z.string().trim().min(1, "Titlul este obligatoriu.").max(300),
  importKey: z.string().trim().min(2).max(160).optional(),
  originalTitle: z.string().trim().max(300).optional(),
  slug: slugSchema,
  authorId: z.uuid("Alege un autor."),
  summary: z.string().trim().max(10_000).optional(),
  verdict: z.string().trim().max(2_000).optional(),
  whyRead: z.string().trim().max(5_000).optional(),
  whyNot: z.string().trim().max(5_000).optional(),
  strengths: z.array(z.string().max(500)).max(20),
  caveats: z.array(z.string().max(500)).max(20),
  status: bookStatusSchema,
  editorialConfidence: z.number().int().min(0).max(100),
  edition: z.object({
    label: z.string().trim().max(200).optional(),
    isbn10: z.string().regex(/^[0-9X]{10}$/).optional(),
    isbn13: z.string().regex(/^[0-9]{13}$/).optional(),
    publisher: z.string().trim().max(200).optional(),
    publicationYear: z.number().int().min(1450).max(3000).optional(),
    language: z.string().trim().min(2).max(12),
    pageCount: z.number().int().positive().optional(),
    coverImportKey: z.string().trim().min(2).max(160).optional(),
    coverAssetId: z.uuid().optional(),
    active: z.boolean(),
  }),
  genreIds: z.array(z.uuid()).max(20),
  themeIds: z.array(z.uuid()).max(30),
  moodIds: z.array(z.uuid()).max(20),
  audienceIds: z.array(z.uuid()).max(20),
  traitScores: z.array(
    z.object({
      traitId: z.uuid(),
      score: z.number().int().min(0).max(100),
      confidence: z.number().int().min(0).max(100),
    }),
  ),
  seo: z.object({
    title: z.string().trim().max(70).optional(),
    description: z.string().trim().max(170).optional(),
    canonical: z.url("URL-ul canonical trebuie să fie valid.").startsWith("https://").optional(),
    indexable: z.boolean(),
  }),
});

export type BookInput = z.infer<typeof bookInputSchema>;

export function parseBookFormData(formData: FormData): BookInput {
  const title = stringValue(formData, "title");
  const traitScores = stringValues(formData, "traitId").flatMap((traitId) => {
    const score = nullableInteger(stringValue(formData, `trait.${traitId}.score`));
    if (score === undefined) return [];
    return [{
      traitId,
      score,
      confidence:
        nullableInteger(stringValue(formData, `trait.${traitId}.confidence`)) ?? 0,
    }];
  });

  const parsed = bookInputSchema.safeParse({
    title,
    importKey: undefined,
    originalTitle: optionalStringValue(formData, "originalTitle"),
    slug: optionalStringValue(formData, "slug") ?? slugify(title),
    authorId: stringValue(formData, "authorId"),
    summary: optionalStringValue(formData, "summary"),
    verdict: optionalStringValue(formData, "verdict"),
    whyRead: optionalStringValue(formData, "whyRead"),
    whyNot: optionalStringValue(formData, "whyNot"),
    strengths: linesValue(formData, "strengths"),
    caveats: linesValue(formData, "caveats"),
    status: stringValue(formData, "status"),
    editorialConfidence: Number(stringValue(formData, "editorialConfidence")),
    edition: {
      label: optionalStringValue(formData, "editionLabel"),
      isbn10: optionalStringValue(formData, "isbn10")?.replaceAll("-", ""),
      isbn13: optionalStringValue(formData, "isbn13")?.replaceAll("-", ""),
      publisher: optionalStringValue(formData, "publisher"),
      publicationYear: nullableInteger(stringValue(formData, "publicationYear")),
      language: stringValue(formData, "language") || "ro",
      pageCount: nullableInteger(stringValue(formData, "pageCount")),
      coverImportKey: undefined,
      coverAssetId: optionalStringValue(formData, "coverAssetId"),
      active: formData.get("editionActive") === "on",
    },
    genreIds: stringValues(formData, "genreIds"),
    themeIds: stringValues(formData, "themeIds"),
    moodIds: stringValues(formData, "moodIds"),
    audienceIds: stringValues(formData, "audienceIds"),
    traitScores,
    seo: {
      title: optionalStringValue(formData, "seoTitle"),
      description: optionalStringValue(formData, "seoDescription"),
      canonical: optionalStringValue(formData, "seoCanonical"),
      indexable: formData.get("seoIndexable") === "on",
    },
  });

  if (!parsed.success) {
    throw new EditorialServiceError(
      "Corectează câmpurile marcate și salvează din nou.",
      zodFieldErrors(parsed.error),
    );
  }

  return parsed.data;
}
