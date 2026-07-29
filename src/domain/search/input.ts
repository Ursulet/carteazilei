import { z } from "zod";

export const SEARCH_QUERY_MINIMUM_LENGTH = 2;
export const SEARCH_QUERY_MAXIMUM_LENGTH = 100;

export const publicSearchQuerySchema = z
  .string()
  .trim()
  .min(SEARCH_QUERY_MINIMUM_LENGTH)
  .max(SEARCH_QUERY_MAXIMUM_LENGTH);

export function readPublicSearchQuery(value: unknown) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = publicSearchQuerySchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}
