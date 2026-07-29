import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import { genres } from "@/db/schema";

export async function getRecommendationQuizOptions(db: Database = getDb()) {
  const genreRows = await db
    .select({ id: genres.id, name: genres.name })
    .from(genres)
    .where(and(eq(genres.status, "published"), isNull(genres.deletedAt)))
    .orderBy(asc(genres.name));
  return { genres: genreRows };
}
