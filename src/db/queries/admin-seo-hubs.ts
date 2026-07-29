import "server-only";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  audiences,
  authors,
  bookAudiences,
  bookGenres,
  bookMoods,
  bookRelationships,
  books,
  bookThemes,
  editorialListBooks,
  editorialLists,
  genres,
  moods,
  seoMetadata,
  themes,
} from "@/db/schema";

export type AdminTaxonomyKind = "genre" | "theme" | "mood" | "audience";

export async function getSeoHubBookOptions(db: Database = getDb()) {
  return db.select({ id: books.id, title: books.title, author: authors.name, status: books.status })
    .from(books).innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .where(and(isNull(books.deletedAt), isNull(authors.deletedAt), sql`${books.status} <> 'archived'`))
    .orderBy(asc(books.title)).limit(250);
}

export async function getAdminEditorialLists(db: Database = getDb()) {
  return db.select({
    id: editorialLists.id,
    title: editorialLists.title,
    slug: editorialLists.slug,
    type: editorialLists.type,
    status: editorialLists.status,
    indexable: editorialLists.indexable,
    updatedAt: editorialLists.updatedAt,
    bookCount: sql<number>`(select count(*)::int from ${editorialListBooks} where ${editorialListBooks.listId} = ${editorialLists.id})`,
  }).from(editorialLists).where(isNull(editorialLists.deletedAt)).orderBy(desc(editorialLists.updatedAt));
}

export async function getAdminEditorialList(id: string, db: Database = getDb()) {
  const [record] = await db.select({
    id: editorialLists.id,
    title: editorialLists.title,
    slug: editorialLists.slug,
    intro: editorialLists.intro,
    methodology: editorialLists.methodology,
    type: editorialLists.type,
    minimumPageCount: editorialLists.minimumPageCount,
    maximumPageCount: editorialLists.maximumPageCount,
    status: editorialLists.status,
    indexable: editorialLists.indexable,
    seoTitle: seoMetadata.titleOverride,
    seoDescription: seoMetadata.descriptionOverride,
  }).from(editorialLists)
    .leftJoin(seoMetadata, and(eq(seoMetadata.entityType, "editorial_list"), eq(seoMetadata.entityId, editorialLists.id)))
    .where(and(eq(editorialLists.id, id), isNull(editorialLists.deletedAt))).limit(1);
  if (!record) return null;
  const selections = await db.select({
    bookId: editorialListBooks.bookId,
    position: editorialListBooks.position,
    reason: editorialListBooks.reason,
    segment: editorialListBooks.segment,
  }).from(editorialListBooks).where(eq(editorialListBooks.listId, id)).orderBy(asc(editorialListBooks.position));
  return { ...record, selections };
}

export async function getAdminTaxonomies(db: Database = getDb()) {
  const [genreRows, themeRows, moodRows, audienceRows] = await Promise.all([
    db.select({ id: genres.id, name: genres.name, slug: genres.slug, status: genres.status, indexable: genres.indexable, updatedAt: genres.updatedAt, bookCount: sql<number>`(select count(*)::int from ${bookGenres} where ${bookGenres.genreId} = ${genres.id})` }).from(genres).where(isNull(genres.deletedAt)),
    db.select({ id: themes.id, name: themes.name, slug: themes.slug, status: themes.status, indexable: themes.indexable, updatedAt: themes.updatedAt, bookCount: sql<number>`(select count(*)::int from ${bookThemes} where ${bookThemes.themeId} = ${themes.id})` }).from(themes).where(isNull(themes.deletedAt)),
    db.select({ id: moods.id, name: moods.name, slug: moods.slug, status: moods.status, indexable: moods.indexable, updatedAt: moods.updatedAt, bookCount: sql<number>`(select count(*)::int from ${bookMoods} where ${bookMoods.moodId} = ${moods.id})` }).from(moods).where(isNull(moods.deletedAt)),
    db.select({ id: audiences.id, name: audiences.name, slug: audiences.slug, status: audiences.status, indexable: audiences.indexable, updatedAt: audiences.updatedAt, bookCount: sql<number>`(select count(*)::int from ${bookAudiences} where ${bookAudiences.audienceId} = ${audiences.id})` }).from(audiences).where(isNull(audiences.deletedAt)),
  ]);
  return [
    ...genreRows.map((row) => ({ kind: "genre" as const, ...row })),
    ...themeRows.map((row) => ({ kind: "theme" as const, ...row })),
    ...moodRows.map((row) => ({ kind: "mood" as const, ...row })),
    ...audienceRows.map((row) => ({ kind: "audience" as const, ...row })),
  ].sort((left, right) => left.name.localeCompare(right.name, "ro"));
}

export async function getAdminTaxonomyHub(kind: AdminTaxonomyKind, id: string, db: Database = getDb()) {
  const entityType = kind;
  const table = kind === "genre" ? genres : kind === "theme" ? themes : kind === "mood" ? moods : audiences;
  const [record] = await db.select({
    id: table.id,
    name: table.name,
    slug: table.slug,
    description: table.description,
    searchIntent: table.searchIntent,
    editorialIntro: table.editorialIntro,
    methodology: table.methodology,
    status: table.status,
    indexable: table.indexable,
    minimumAge: kind === "audience" ? audiences.minimumAge : sql<number | null>`null`,
    maximumAge: kind === "audience" ? audiences.maximumAge : sql<number | null>`null`,
    seoTitle: seoMetadata.titleOverride,
    seoDescription: seoMetadata.descriptionOverride,
  }).from(table)
    .leftJoin(seoMetadata, and(eq(seoMetadata.entityType, entityType), eq(seoMetadata.entityId, table.id)))
    .where(and(eq(table.id, id), isNull(table.deletedAt))).limit(1);
  if (!record) return null;

  if (kind === "genre") {
    const selections = await db.select({ bookId: bookGenres.bookId, position: bookGenres.hubPosition, reason: bookGenres.hubReason, strength: sql<number | null>`null` }).from(bookGenres).where(eq(bookGenres.genreId, id));
    return { ...record, selections };
  }
  if (kind === "theme") {
    const selections = await db.select({ bookId: bookThemes.bookId, position: bookThemes.hubPosition, reason: bookThemes.hubReason, strength: sql<number | null>`null` }).from(bookThemes).where(eq(bookThemes.themeId, id));
    return { ...record, selections };
  }
  if (kind === "mood") {
    const selections = await db.select({ bookId: bookMoods.bookId, position: bookMoods.hubPosition, reason: bookMoods.hubReason, strength: bookMoods.strength }).from(bookMoods).where(eq(bookMoods.moodId, id));
    return { ...record, selections };
  }
  const selections = await db.select({ bookId: bookAudiences.bookId, position: bookAudiences.hubPosition, reason: bookAudiences.hubReason, strength: sql<number | null>`null` }).from(bookAudiences).where(eq(bookAudiences.audienceId, id));
  return { ...record, selections };
}

export async function getAdminRelationships(db: Database = getDb()) {
  const rows = await db.execute(sql<{
    id: string;
    source_title: string;
    target_title: string;
    type: string;
    next_read_basis: string | null;
    strength: number;
    active: boolean;
    updated_at: Date;
  }>`select r.id, source.title source_title, target.title target_title, r.type, r.next_read_basis, r.strength, r.active, r.updated_at
    from book_relationships r
    join books source on source.id = r.source_book_id
    join books target on target.id = r.target_book_id
    where source.deleted_at is null and target.deleted_at is null
    order by r.updated_at desc`);
  return rows.map((row) => ({
    id: String(row.id),
    source_title: String(row.source_title),
    target_title: String(row.target_title),
    type: String(row.type),
    next_read_basis: row.next_read_basis ? String(row.next_read_basis) : null,
    strength: Number(row.strength),
    active: Boolean(row.active),
    updated_at: row.updated_at instanceof Date ? row.updated_at : new Date(String(row.updated_at)),
  }));
}

export async function getAdminRelationship(id: string, db: Database = getDb()) {
  const [record] = await db.select().from(bookRelationships).where(eq(bookRelationships.id, id)).limit(1);
  return record ?? null;
}
