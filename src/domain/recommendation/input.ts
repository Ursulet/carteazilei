import { z } from "zod";

import {
  childAgeValues,
  childGoalValues,
  childReadingLevelValues,
  childReadingModeValues,
  childSensitivityValues,
  dealBreakerValues,
  giftAgeValues,
  giftOccasionValues,
  giftReadingHabitValues,
  giftRelationshipValues,
  giftStyleValues,
  readingLengthValues,
  readingNeedValues,
  readingPaceValues,
  type RecommendationAnswers,
  type RecommendationBranch,
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

const childSensitivitySelectionSchema = z
  .array(z.enum(childSensitivityValues))
  .min(1, "Alege cel puțin o opțiune.")
  .max(childSensitivityValues.length)
  .refine(
    (values) => !values.includes("none") || values.length === 1,
    "«Nicio sensibilitate» nu poate fi combinată cu alte opțiuni.",
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

export const giftRecommendationAnswersSchema = z.object({
  giftRelationship: z.enum(giftRelationshipValues).optional(),
  giftAge: z.enum(giftAgeValues).optional(),
  giftOccasion: z.enum(giftOccasionValues).optional(),
  giftInterests: genreSelectionSchema.optional(),
  giftReadingHabit: z.enum(giftReadingHabitValues).optional(),
  giftStyle: z.enum(giftStyleValues).optional(),
});

export const completeGiftRecommendationAnswersSchema = z.object({
  giftRelationship: z.enum(giftRelationshipValues),
  giftAge: z.enum(giftAgeValues),
  giftOccasion: z.enum(giftOccasionValues),
  giftInterests: genreSelectionSchema,
  giftReadingHabit: z.enum(giftReadingHabitValues),
  giftStyle: z.enum(giftStyleValues),
});

export const childRecommendationAnswersSchema = z.object({
  childAge: z.enum(childAgeValues).optional(),
  childReadingLevel: z.enum(childReadingLevelValues).optional(),
  childReadingMode: z.enum(childReadingModeValues).optional(),
  childInterests: genreSelectionSchema.optional(),
  childGoal: z.enum(childGoalValues).optional(),
  childSensitivities: childSensitivitySelectionSchema.optional(),
});

export const completeChildRecommendationAnswersSchema = z.object({
  childAge: z.enum(childAgeValues),
  childReadingLevel: z.enum(childReadingLevelValues),
  childReadingMode: z.enum(childReadingModeValues),
  childInterests: genreSelectionSchema,
  childGoal: z.enum(childGoalValues),
  childSensitivities: childSensitivitySelectionSchema,
});

export const recommendationStepPayloadSchema = z.discriminatedUnion("step", [
  z.object({ step: z.literal("need"), value: z.enum(readingNeedValues) }),
  z.object({ step: z.literal("genres"), value: genreSelectionSchema }),
  z.object({ step: z.literal("pace"), value: z.enum(readingPaceValues) }),
  z.object({ step: z.literal("length"), value: z.enum(readingLengthValues) }),
  z.object({ step: z.literal("liked_book"), value: z.uuid().nullable() }),
  z.object({ step: z.literal("deal_breakers"), value: dealBreakerSelectionSchema }),
  z.object({ step: z.literal("gift_relationship"), value: z.enum(giftRelationshipValues) }),
  z.object({ step: z.literal("gift_age"), value: z.enum(giftAgeValues) }),
  z.object({ step: z.literal("gift_occasion"), value: z.enum(giftOccasionValues) }),
  z.object({ step: z.literal("gift_interests"), value: genreSelectionSchema }),
  z.object({ step: z.literal("gift_reading_habit"), value: z.enum(giftReadingHabitValues) }),
  z.object({ step: z.literal("gift_style"), value: z.enum(giftStyleValues) }),
  z.object({ step: z.literal("child_age"), value: z.enum(childAgeValues) }),
  z.object({ step: z.literal("child_reading_level"), value: z.enum(childReadingLevelValues) }),
  z.object({ step: z.literal("child_reading_mode"), value: z.enum(childReadingModeValues) }),
  z.object({ step: z.literal("child_interests"), value: genreSelectionSchema }),
  z.object({ step: z.literal("child_goal"), value: z.enum(childGoalValues) }),
  z.object({ step: z.literal("child_sensitivities"), value: childSensitivitySelectionSchema }),
]);

const answerValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const recommendationSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  steps: z.record(z.string(), answerValueSchema),
});

export function parsePartialRecommendationAnswers(
  branch: RecommendationBranch,
  steps: unknown,
): RecommendationAnswers | null {
  const parsed = branch === "gift"
    ? giftRecommendationAnswersSchema.safeParse(steps)
    : branch === "child"
      ? childRecommendationAnswersSchema.safeParse(steps)
      : selfRecommendationAnswersSchema.safeParse(steps);
  return parsed.success ? parsed.data : null;
}

export function parseCompleteRecommendationAnswers(
  branch: RecommendationBranch,
  steps: unknown,
): RecommendationAnswers | null {
  const parsed = branch === "gift"
    ? completeGiftRecommendationAnswersSchema.safeParse(steps)
    : branch === "child"
      ? completeChildRecommendationAnswersSchema.safeParse(steps)
      : completeSelfRecommendationAnswersSchema.safeParse(steps);
  return parsed.success ? parsed.data : null;
}

export type RecommendationStepPayload = z.infer<typeof recommendationStepPayloadSchema>;
