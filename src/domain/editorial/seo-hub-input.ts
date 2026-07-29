import { z } from "zod";

import { nextReadBasisValues, relationshipProvenanceValues, relationshipTypeValues } from "@/db/schema/common";

import { EditorialServiceError } from "./action-state";
import {
  nullableInteger,
  optionalStringValue,
  slugSchema,
  stringValue,
  stringValues,
  zodFieldErrors,
} from "./form-data";

const selectionSchema = z.object({
  bookId: z.uuid(),
  position: z.number().int().positive(),
  reason: z.string().trim().max(1_000).optional(),
  segment: z.string().trim().max(100).optional(),
  strength: z.number().int().min(0).max(100).optional(),
});

const seoFields = {
  seoTitle: z.string().trim().min(1).max(70).optional(),
  seoDescription: z.string().trim().min(1).max(170).optional(),
};

export const editorialListInputSchema = z.object({
  title: z.string().trim().min(1).max(250),
  slug: slugSchema,
  intro: z.string().trim().max(10_000).optional(),
  methodology: z.string().trim().max(10_000).optional(),
  type: z.enum(["list", "guide", "hub", "length_hub"]),
  minimumPageCount: z.number().int().min(0).optional(),
  maximumPageCount: z.number().int().positive().optional(),
  status: z.enum(["draft", "review", "published", "archived"]),
  indexable: z.boolean(),
  selections: z.array(selectionSchema.extend({
    reason: z.string().trim().min(1, "Motivul selecției este obligatoriu.").max(1_000),
  })).max(100),
  ...seoFields,
}).superRefine((value, context) => {
  if (value.type === "length_hub") {
    if (value.minimumPageCount === undefined && value.maximumPageCount === undefined) {
      context.addIssue({ code: "custom", path: ["minimumPageCount"], message: "Definește cel puțin o limită de pagini." });
    }
    if (value.minimumPageCount !== undefined && value.maximumPageCount !== undefined && value.maximumPageCount < value.minimumPageCount) {
      context.addIssue({ code: "custom", path: ["maximumPageCount"], message: "Limita maximă trebuie să fie mai mare decât limita minimă." });
    }
  } else if (value.minimumPageCount !== undefined || value.maximumPageCount !== undefined) {
    context.addIssue({ code: "custom", path: ["minimumPageCount"], message: "Intervalul de pagini este permis numai pentru hub-uri de lungime." });
  }
});

export const taxonomyHubInputSchema = z.object({
  kind: z.enum(["genre", "theme", "mood", "audience"]),
  name: z.string().trim().min(1).max(160),
  slug: slugSchema,
  description: z.string().trim().max(5_000).optional(),
  searchIntent: z.string().trim().max(1_000).optional(),
  editorialIntro: z.string().trim().max(10_000).optional(),
  methodology: z.string().trim().max(10_000).optional(),
  minimumAge: z.number().int().min(0).max(120).optional(),
  maximumAge: z.number().int().min(0).max(120).optional(),
  status: z.enum(["draft", "published", "archived"]),
  indexable: z.boolean(),
  selections: z.array(selectionSchema).max(100),
  ...seoFields,
}).superRefine((value, context) => {
  if (value.kind !== "audience" && (value.minimumAge !== undefined || value.maximumAge !== undefined)) {
    context.addIssue({ code: "custom", path: ["minimumAge"], message: "Vârsta este permisă numai pentru audiențe." });
  }
  if (value.minimumAge !== undefined && value.maximumAge !== undefined && value.maximumAge < value.minimumAge) {
    context.addIssue({ code: "custom", path: ["maximumAge"], message: "Vârsta maximă trebuie să fie cel puțin egală cu cea minimă." });
  }
});

export const bookRelationshipInputSchema = z.object({
  sourceBookId: z.uuid("Alege cartea sursă."),
  targetBookId: z.uuid("Alege cartea recomandată."),
  type: z.enum(relationshipTypeValues),
  nextReadBasis: z.enum(nextReadBasisValues).optional(),
  strength: z.number().int().min(0).max(100),
  publicReason: z.string().trim().max(1_000).optional(),
  provenance: z.enum(relationshipProvenanceValues),
  active: z.boolean(),
}).superRefine((value, context) => {
  if (value.sourceBookId === value.targetBookId) {
    context.addIssue({ code: "custom", path: ["targetBookId"], message: "Cartea sursă și destinația trebuie să fie diferite." });
  }
  if (value.type === "next_read" && !value.nextReadBasis) {
    context.addIssue({ code: "custom", path: ["nextReadBasis"], message: "Alege ce continuă recomandarea." });
  }
  if (value.type !== "next_read" && value.nextReadBasis) {
    context.addIssue({ code: "custom", path: ["nextReadBasis"], message: "Baza continuării este permisă numai pentru next read." });
  }
  if (value.active && !value.publicReason) {
    context.addIssue({ code: "custom", path: ["publicReason"], message: "O relație activă are nevoie de un motiv public." });
  }
});

export type EditorialListInput = z.infer<typeof editorialListInputSchema>;
export type TaxonomyHubInput = z.infer<typeof taxonomyHubInputSchema>;
export type BookRelationshipInput = z.infer<typeof bookRelationshipInputSchema>;

function parseSelections(formData: FormData) {
  return stringValues(formData, "bookId").map((bookId, index) => ({
    bookId,
    position: nullableInteger(stringValue(formData, `book.${bookId}.position`)) ?? index + 1,
    reason: stringValue(formData, `book.${bookId}.reason`),
    segment: optionalStringValue(formData, `book.${bookId}.segment`),
    strength: nullableInteger(stringValue(formData, `book.${bookId}.strength`)),
  }));
}

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new EditorialServiceError("Corectează câmpurile marcate și salvează din nou.", zodFieldErrors(parsed.error));
  }
  return parsed.data;
}

export function parseEditorialListFormData(formData: FormData) {
  return parseOrThrow(editorialListInputSchema, {
    title: stringValue(formData, "title"),
    slug: stringValue(formData, "slug"),
    intro: optionalStringValue(formData, "intro"),
    methodology: optionalStringValue(formData, "methodology"),
    type: stringValue(formData, "type"),
    minimumPageCount: nullableInteger(stringValue(formData, "minimumPageCount")),
    maximumPageCount: nullableInteger(stringValue(formData, "maximumPageCount")),
    status: stringValue(formData, "status"),
    indexable: formData.get("indexable") === "on",
    selections: parseSelections(formData),
    seoTitle: optionalStringValue(formData, "seoTitle"),
    seoDescription: optionalStringValue(formData, "seoDescription"),
  });
}

export function parseTaxonomyHubFormData(kind: string, formData: FormData) {
  return parseOrThrow(taxonomyHubInputSchema, {
    kind,
    name: stringValue(formData, "name"),
    slug: stringValue(formData, "slug"),
    description: optionalStringValue(formData, "description"),
    searchIntent: optionalStringValue(formData, "searchIntent"),
    editorialIntro: optionalStringValue(formData, "editorialIntro"),
    methodology: optionalStringValue(formData, "methodology"),
    minimumAge: nullableInteger(stringValue(formData, "minimumAge")),
    maximumAge: nullableInteger(stringValue(formData, "maximumAge")),
    status: stringValue(formData, "status"),
    indexable: formData.get("indexable") === "on",
    selections: parseSelections(formData),
    seoTitle: optionalStringValue(formData, "seoTitle"),
    seoDescription: optionalStringValue(formData, "seoDescription"),
  });
}

export function parseBookRelationshipFormData(formData: FormData) {
  return parseOrThrow(bookRelationshipInputSchema, {
    sourceBookId: stringValue(formData, "sourceBookId"),
    targetBookId: stringValue(formData, "targetBookId"),
    type: stringValue(formData, "type"),
    nextReadBasis: optionalStringValue(formData, "nextReadBasis"),
    strength: Number(stringValue(formData, "strength")),
    publicReason: optionalStringValue(formData, "publicReason"),
    provenance: stringValue(formData, "provenance"),
    active: formData.get("active") === "on",
  });
}
