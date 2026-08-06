import "server-only";

import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  authors,
  books,
  editorialListBooks,
  editorialLists,
  mediaAssets,
  seoMetadata,
} from "@/db/schema";
import {
  listPublicBookCardsByAuthor,
  publicBookPageEligibility,
  type PublicBookCard,
} from "@/db/queries/public-book-pages";

export async function listPublicAuthors(db: Database = getDb()) {
  return db
    .select({
      id: authors.id,
      name: authors.name,
      slug: authors.slug,
      bio: authors.bio,
      portrait: {
        id: mediaAssets.id,
        altText: mediaAssets.altText,
        width: mediaAssets.width,
        height: mediaAssets.height,
      },
      bookCount: sql<number>`count("books"."id")::int`,
    })
    .from(authors)
    .innerJoin(books, eq(books.primaryAuthorId, authors.id))
    .leftJoin(mediaAssets, and(eq(mediaAssets.id, authors.portraitAssetId), isNull(mediaAssets.deletedAt)))
    .where(and(
      eq(authors.status, "published"),
      isNull(authors.deletedAt),
      eq(books.status, "published"),
      isNull(books.deletedAt),
      publicBookPageEligibility,
    ))
    .groupBy(authors.id, authors.name, authors.slug, authors.bio, mediaAssets.id, mediaAssets.altText, mediaAssets.width, mediaAssets.height)
    .orderBy(asc(authors.name));
}

export async function getPublicAuthorPage(slug: string, db: Database = getDb()) {
  const [author] = await db
    .select({
      id: authors.id,
      name: authors.name,
      slug: authors.slug,
      bio: authors.bio,
      portrait: {
        id: mediaAssets.id,
        altText: mediaAssets.altText,
        width: mediaAssets.width,
        height: mediaAssets.height,
      },
      publishedAt: authors.publishedAt,
      updatedAt: authors.updatedAt,
      seo: {
        title: seoMetadata.titleOverride,
        description: seoMetadata.descriptionOverride,
        canonical: seoMetadata.canonicalOverride,
        indexable: seoMetadata.indexable,
      },
    })
    .from(authors)
    .leftJoin(mediaAssets, and(eq(mediaAssets.id, authors.portraitAssetId), isNull(mediaAssets.deletedAt)))
    .leftJoin(seoMetadata, and(eq(seoMetadata.entityType, "author"), eq(seoMetadata.entityId, authors.id)))
    .where(and(eq(authors.slug, slug), eq(authors.status, "published"), isNull(authors.deletedAt)))
    .limit(1);
  if (!author) return null;

  const [allBooks, listRows, startRows] = await Promise.all([
    listPublicBookCardsByAuthor(author.id, db),
    db.selectDistinct({ title: editorialLists.title, slug: editorialLists.slug, intro: editorialLists.intro })
      .from(editorialLists)
      .innerJoin(editorialListBooks, eq(editorialListBooks.listId, editorialLists.id))
      .innerJoin(books, eq(books.id, editorialListBooks.bookId))
      .where(and(
        eq(books.primaryAuthorId, author.id),
        eq(books.status, "published"),
        isNull(books.deletedAt),
        eq(editorialLists.status, "published"),
        isNull(editorialLists.deletedAt),
      )).orderBy(asc(editorialLists.title)).limit(12),
    db.select({ bookId: books.id, reason: editorialListBooks.reason })
      .from(editorialListBooks)
      .innerJoin(editorialLists, eq(editorialLists.id, editorialListBooks.listId))
      .innerJoin(books, eq(books.id, editorialListBooks.bookId))
      .where(and(
        eq(books.primaryAuthorId, author.id),
        eq(books.status, "published"),
        isNull(books.deletedAt),
        eq(editorialLists.status, "published"),
        isNull(editorialLists.deletedAt),
        sql`${editorialListBooks.segment} in ('start_here', 'de_unde_sa_incepi')`,
      )).orderBy(asc(editorialListBooks.position)).limit(3),
  ]);
  const authorBooks = allBooks;
  if (authorBooks.length === 0) return null;
  const byId = new Map<string, PublicBookCard>(authorBooks.map((book) => [book.id, book]));
  const startHere = startRows.flatMap((row) => {
    const book = byId.get(row.bookId);
    return book ? [{ ...book, reason: row.reason }] : [];
  });
  return { ...author, books: authorBooks, lists: listRows, startHere };
}

export type PublicAuthorPage = NonNullable<Awaited<ReturnType<typeof getPublicAuthorPage>>>;
