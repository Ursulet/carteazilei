import "server-only";

import { and, eq, exists, isNull, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import { authors, books, seoMetadata } from "@/db/schema";
import { publicBookPageEligibility } from "@/db/queries/public-book-pages";
import { writeAuditLog } from "@/lib/audit/service";

const UPSERT_CHUNK_SIZE = 500;

function chunks<T>(items: T[], size = UPSERT_CHUNK_SIZE) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

const eligibleBookWhere = and(
  eq(books.status, "published"),
  isNull(books.deletedAt),
  eq(authors.status, "published"),
  isNull(authors.deletedAt),
  publicBookPageEligibility,
);

function eligibleAuthorWhere(db: Database) {
  return and(
    eq(authors.status, "published"),
    isNull(authors.deletedAt),
    exists(
      db
        .select({ value: sql`1` })
        .from(books)
        .where(and(
          eq(books.primaryAuthorId, authors.id),
          eq(books.status, "published"),
          isNull(books.deletedAt),
          publicBookPageEligibility,
        )),
    ),
  );
}

export async function getSearchIndexingOverview(db: Database = getDb()) {
  const [bookStats, authorStats] = await Promise.all([
    db
      .select({
        eligible: sql<number>`count(*)::int`,
        indexed: sql<number>`count(*) filter (where exists (
          select 1 from ${seoMetadata} seo
          where seo.entity_type = 'book'
            and seo.entity_id = ${books.id}
            and seo.indexable = true
        ))::int`,
      })
      .from(books)
      .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
      .where(eligibleBookWhere),
    db
      .select({
        eligible: sql<number>`count(*)::int`,
        indexed: sql<number>`count(*) filter (where exists (
          select 1 from ${seoMetadata} seo
          where seo.entity_type = 'author'
            and seo.entity_id = ${authors.id}
            and seo.indexable = true
        ))::int`,
      })
      .from(authors)
      .where(eligibleAuthorWhere(db)),
  ]);

  return {
    books: bookStats[0] ?? { eligible: 0, indexed: 0 },
    authors: authorStats[0] ?? { eligible: 0, indexed: 0 },
  };
}

export async function includePublishedContentInSearch(actorUserId: string) {
  const db = getDb();
  const bookRows = await db
    .select({ id: books.id, authorId: books.primaryAuthorId })
    .from(books)
    .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .where(eligibleBookWhere);
  // Autorii sunt derivați direct din cărțile eligibile. Astfel, aceeași regulă
  // care include o carte în sitemap include garantat și profilul autorului ei.
  const authorRows = [...new Set(bookRows.map((book) => book.authorId))].map((id) => ({ id }));

  const now = new Date();
  await db.transaction(async (transaction) => {
    let updatedBooks = 0;
    let updatedAuthors = 0;

    for (const batch of chunks(bookRows)) {
      if (!batch.length) continue;
      const updated = await transaction
        .insert(seoMetadata)
        .values(batch.map(({ id }) => ({
          entityType: "book" as const,
          entityId: id,
          indexable: true,
          lastReviewedAt: now,
        })))
        .onConflictDoUpdate({
          target: [seoMetadata.entityType, seoMetadata.entityId],
          set: { indexable: true, lastReviewedAt: now, updatedAt: now },
        })
        .returning({ id: seoMetadata.id });
      updatedBooks += updated.length;
    }

    for (const batch of chunks(authorRows)) {
      if (!batch.length) continue;
      const updated = await transaction
        .insert(seoMetadata)
        .values(batch.map(({ id }) => ({
          entityType: "author" as const,
          entityId: id,
          indexable: true,
          lastReviewedAt: now,
        })))
        .onConflictDoUpdate({
          target: [seoMetadata.entityType, seoMetadata.entityId],
          set: { indexable: true, lastReviewedAt: now, updatedAt: now },
        })
        .returning({ id: seoMetadata.id });
      updatedAuthors += updated.length;
    }

    if (updatedBooks !== bookRows.length || updatedAuthors !== authorRows.length) {
      throw new Error(
        `Sincronizare SEO incompletă: ${updatedBooks}/${bookRows.length} cărți, ${updatedAuthors}/${authorRows.length} autori.`,
      );
    }

    await writeAuditLog({
      actorUserId,
      action: "seo.search_indexing_sync",
      entityType: "seo_batch",
      entityId: null,
      diff: {
        indexedBooks: updatedBooks,
        indexedAuthors: updatedAuthors,
      },
    }, transaction);
  });

  return { books: bookRows.length, authors: authorRows.length };
}
