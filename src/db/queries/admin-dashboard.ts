import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { authors, bookOffers, books, dailyFeatures, mediaAssets, retailers } from "@/db/schema";

export async function getAdminDashboardSummary() {
  const db = getDb();
  const [bookCounts, authorCounts, dailyCounts, commercialCounts, mediaCounts, recentBooks] = await Promise.all([
    db.select({
      total: sql<number>`count(*)::int`,
      draft: sql<number>`count(*) filter (where ${books.status} in ('draft', 'needs_review', 'ready'))::int`,
      published: sql<number>`count(*) filter (where ${books.status} = 'published')::int`,
    }).from(books).where(isNull(books.deletedAt)),
    db.select({ total: sql<number>`count(*)::int` }).from(authors).where(isNull(authors.deletedAt)),
    db.select({
      scheduled: sql<number>`count(*) filter (where ${dailyFeatures.status} in ('scheduled', 'published'))::int`,
    }).from(dailyFeatures).where(isNull(dailyFeatures.deletedAt)),
    db.select({
      partners: sql<number>`count(distinct ${retailers.id}) filter (where ${retailers.active})::int`,
      offers: sql<number>`count(distinct ${bookOffers.id}) filter (where ${bookOffers.active} and ${bookOffers.deletedAt} is null)::int`,
    }).from(retailers).leftJoin(bookOffers, eq(bookOffers.retailerId, retailers.id)).where(isNull(retailers.deletedAt)),
    db.select({ total: sql<number>`count(*)::int` }).from(mediaAssets).where(isNull(mediaAssets.deletedAt)),
    db.select({ id: books.id, title: books.title, status: books.status, author: authors.name, updatedAt: books.updatedAt })
      .from(books)
      .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
      .where(and(isNull(books.deletedAt), isNull(authors.deletedAt)))
      .orderBy(desc(books.updatedAt))
      .limit(5),
  ]);

  return {
    books: bookCounts[0] ?? { total: 0, draft: 0, published: 0 },
    authors: authorCounts[0]?.total ?? 0,
    dailyFeatures: dailyCounts[0]?.scheduled ?? 0,
    partners: commercialCounts[0]?.partners ?? 0,
    offers: commercialCounts[0]?.offers ?? 0,
    media: mediaCounts[0]?.total ?? 0,
    recentBooks,
  };
}
