import { and, asc, eq, isNull } from "drizzle-orm";

import type { Database } from "@/db";
import { authors, books } from "@/db/schema";

export const publishedBookPredicate = and(
  eq(books.status, "published"),
  isNull(books.deletedAt),
  eq(authors.status, "published"),
  isNull(authors.deletedAt),
);

export async function getPublishedBookBySlug(db: Database, slug: string) {
  const [book] = await db
    .select({
      id: books.id,
      title: books.title,
      subtitle: books.subtitle,
      slug: books.slug,
      originalTitle: books.originalTitle,
      shortVerdict: books.shortVerdict,
      spoilerFreeSummary: books.spoilerFreeSummary,
      editorialConfidence: books.editorialConfidence,
      publishedAt: books.publishedAt,
      author: {
        id: authors.id,
        name: authors.name,
        slug: authors.slug,
      },
    })
    .from(books)
    .innerJoin(authors, eq(books.primaryAuthorId, authors.id))
    .where(and(publishedBookPredicate, eq(books.slug, slug)))
    .limit(1);

  return book ?? null;
}

export async function listPublishedBooks(db: Database, limit = 24) {
  return db
    .select({
      id: books.id,
      title: books.title,
      slug: books.slug,
      shortVerdict: books.shortVerdict,
      publishedAt: books.publishedAt,
      author: {
        id: authors.id,
        name: authors.name,
        slug: authors.slug,
      },
    })
    .from(books)
    .innerJoin(authors, eq(books.primaryAuthorId, authors.id))
    .where(publishedBookPredicate)
    .orderBy(asc(books.title))
    .limit(Math.min(Math.max(limit, 1), 100));
}

