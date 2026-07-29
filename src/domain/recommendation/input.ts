import { z } from "zod";

import {
  dealBreakerValues,
  readingLengthValues,
  readingNeedValues,
  readingPaceValues,
} from "./types";

const genreSelectionSchema = z
  .array(z.union([z.literal("any"), z.uuid()]))
  .min(1, "Alege cel puțin o opțiune.")
  .max(3, "Poți alege maximum trei genuri.")
  .refine(
    (values) => !values.includes("any") || values.length === 1,
    "«Nu contează genul» nu poate fi combinat cu alte genuri.",
  );

const dealBreakerSelectionSchema = z
  .array(z.enum(dealBreakerValues))
  .min(1, "Alege cel puțin o opțiune.")
  .max(6)
  .refine(
    (values) => !values.includes("none") || values.length === 1,
    "«Niciunul» nu poate fi combinat cu alte opțiuni.",
  );

export const selfRecommendationAnswersSchema = z.object({
  need: z.enum(readingNeedValues).optional(),
  genres: genreSelectionSchema.optional(),
  pace: z.enum(readingPaceValues).optional(),
  length: z.enum(readingLengthValues).optional(),
  likedBookId: z.uuid().nullable().optional(),
  dealBreakers: dealBreakerSelectionSchema.optional(),
});

export const completeSelfRecommendationAnswersSchema = z.object({
  need: z.enum(readingNeedValues),
  genres: genreSelectionSchema,
  pace: z.enum(readingPaceValues),
  length: z.enum(readingLengthValues),
  likedBookId: z.uuid().nullable().optional(),
  dealBreakers: dealBreakerSelectionSchema,
});

export const recommendationStepPayloadSchema = z.discriminatedUnion("step", [
  z.object({ step: z.literal("need"), value: z.enum(readingNeedValues) }),
  z.object({ step: z.literal("genres"), value: genreSelectionSchema }),
  z.object({ step: z.literal("pace"), value: z.enum(readingPaceValues) }),
  z.object({ step: z.literal("length"), value: z.enum(readingLengthValues) }),
  z.object({ step: z.literal("liked_book"), value: z.uuid().nullable() }),
  z.object({ step: z.literal("deal_breakers"), value: dealBreakerSelectionSchema }),
]);

export const recommendationSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  steps: selfRecommendationAnswersSchema,
});

export type RecommendationStepPayload = z.infer<typeof recommendationStepPayloadSchema>;
