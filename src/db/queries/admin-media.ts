import "server-only";

import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";

import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";

export async function getAdminMedia(filters: { q?: string; status?: string } = {}) {
  const conditions = [isNull(mediaAssets.deletedAt)];
  if (filters.status) conditions.push(eq(mediaAssets.status, filters.status));
  if (filters.q) conditions.push(or(ilike(mediaAssets.title, `%${filters.q}%`), ilike(mediaAssets.altText, `%${filters.q}%`))!);
  return getDb()
    .select()
    .from(mediaAssets)
    .where(and(...conditions))
    .orderBy(desc(mediaAssets.createdAt));
}

export async function getAdminMediaAsset(id: string) { return (await getDb().select().from(mediaAssets).where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt))).limit(1))[0] ?? null; }
