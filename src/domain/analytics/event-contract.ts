import { z } from "zod";

const sourcePath = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((value) => value.startsWith("/") && !value.startsWith("//"));

const resultToken = z.string().regex(/^[A-Za-z0-9_-]{32,128}$/);

const referrerHost = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(253)
  .regex(/^[a-z0-9.-]+$/);

export const publicProductEventSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("page_viewed"),
    sourcePath,
    isLanding: z.boolean(),
    referrerHost: referrerHost.optional(),
  }).strict(),
  z.object({
    event: z.literal("recommendation_result_shown"),
    resultToken,
    resultId: z.uuid(),
    sourcePath,
  }).strict(),
  z.object({
    event: z.literal("recommendation_alternative_requested"),
    resultToken,
    fromResultId: z.uuid(),
    resultId: z.uuid(),
    sourcePath,
  }).strict(),
  z.object({
    event: z.literal("book_viewed"),
    bookId: z.uuid(),
    sourcePath,
  }).strict(),
  z.object({
    event: z.literal("daily_feature_viewed"),
    dailyFeatureId: z.uuid(),
    bookId: z.uuid(),
    sourcePath,
  }).strict(),
]);

export type PublicProductEventInput = z.infer<typeof publicProductEventSchema>;
