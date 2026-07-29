import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  audiences,
  authors,
  bookRelationships,
  books,
  editorialLists,
  genres,
  moods,
} from "@/db/schema";
import {
  getPublicEditorialListPage,
  getPublicRelationshipLanding,
  getPublicTaxonomyHub,
} from "@/db/queries/public-seo-hubs";

export async function getPublicHomepageDiscovery(db: Database = getDb()) {
  const [moodRows, genreRows, audienceRows, nextReadRows, listRows] = await Promise.all([
    db.select({ name: moods.name, slug: moods.slug, description: moods.description }).from(moods)
      .where(and(eq(moods.status, "published"), eq(moods.indexable, true), isNull(moods.deletedAt))).orderBy(moods.name).limit(6),
    db.select({ name: genres.name, slug: genres.slug, description: genres.description }).from(genres)
      .where(and(eq(genres.status, "published"), eq(genres.indexable, true), isNull(genres.deletedAt))).orderBy(genres.name).limit(8),
    db.select({ name: audiences.name, slug: audiences.slug, description: audiences.description }).from(audiences)
      .where(and(eq(audiences.status, "published"), eq(audiences.indexable, true), isNull(audiences.deletedAt))).orderBy(audiences.name).limit(6),
    db.select({ title: books.title, slug: books.slug, author: authors.name })
      .from(bookRelationships)
      .innerJoin(books, eq(books.id, bookRelationships.sourceBookId))
      .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
      .where(and(
        eq(bookRelationships.type, "next_read"),
        eq(bookRelationships.active, true),
        sql`nullif(btrim(${bookRelationships.publicReason}), '') is not null`,
        eq(books.status, "published"),
        isNull(books.deletedAt),
        eq(authors.status, "published"),
        isNull(authors.deletedAt),
        sql`exists (select 1 from books target where target.id = ${bookRelationships.targetBookId} and target.status = 'published' and target.deleted_at is null)`,
      ))
      .groupBy(books.id, books.title, books.slug, authors.name)
      .orderBy(books.title)
      .limit(4),
    db.select({ title: editorialLists.title, slug: editorialLists.slug, intro: editorialLists.intro, type: editorialLists.type })
      .from(editorialLists)
      .where(and(
        eq(editorialLists.status, "published"),
        eq(editorialLists.indexable, true),
        isNull(editorialLists.deletedAt),
        sql`${editorialLists.type} in ('list', 'guide', 'hub')`,
      ))
      .orderBy(sql`${editorialLists.publishedAt} desc nulls last`)
      .limit(6),
  ]);
  const [moodPages, genrePages, audiencePages, nextReadPages, listPages] = await Promise.all([
    Promise.all(moodRows.map((row) => getPublicTaxonomyHub("stare", row.slug, db))),
    Promise.all(genreRows.map((row) => getPublicTaxonomyHub("gen", row.slug, db))),
    Promise.all(audienceRows.map((row) => getPublicTaxonomyHub("pentru", row.slug, db))),
    Promise.all(nextReadRows.map((row) => getPublicRelationshipLanding(row.slug, "next_read", db))),
    Promise.all(listRows.map((row) => getPublicEditorialListPage(row.slug, "list", db))),
  ]);
  return {
    moods: moodPages.flatMap((page) => page?.quality.indexable ? [{ name: page.entity.name, slug: page.entity.slug, description: page.entity.description }] : []),
    genres: genrePages.flatMap((page) => page?.quality.indexable ? [{ name: page.entity.name, slug: page.entity.slug, description: page.entity.description }] : []),
    audiences: audiencePages.flatMap((page) => page?.quality.indexable ? [{ name: page.entity.name, slug: page.entity.slug, description: page.entity.description }] : []),
    nextReads: nextReadPages.flatMap((page) => page?.quality.indexable ? [{ title: page.source.book.title, slug: page.source.book.slug, author: page.source.author.name }] : []),
    lists: listPages.flatMap((page) => page?.quality.indexable ? [{ title: page.list.title, slug: page.list.slug, intro: page.list.intro, type: page.list.type }] : []),
  };
}
