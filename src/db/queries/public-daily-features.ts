import "server-only";

import { and, desc, eq, isNull, sql, type SQL } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  authors,
  bookGenres,
  books,
  dailyFeatures,
  editors,
  genres,
} from "@/db/schema";
import { listPublicCommercialOffersForBook } from "@/db/queries/public-commercial-offers";
import { getEditorialDate } from "@/domain/editorial/bucharest-date";

export type DailyArchiveFilters = {
  year?: number;
  month?: number;
  genre?: string;
  editorId?: string;
};

const publicDailyConditions = [
  eq(dailyFeatures.status, "published"),
  isNull(dailyFeatures.deletedAt),
  eq(books.status, "published"),
  isNull(books.deletedAt),
  eq(authors.status, "published"),
  isNull(authors.deletedAt),
  isNull(editors.deletedAt),
] as const;

function dailyFeatureSelection() {
  return {
    id: dailyFeatures.id,
    featureDate: dailyFeatures.featureDate,
    headline: dailyFeatures.headline,
    whyToday: dailyFeatures.whyToday,
    audienceNote: dailyFeatures.audienceNote,
    fitPoints: dailyFeatures.fitPoints,
    caveat: dailyFeatures.caveat,
    publishedAt: dailyFeatures.publishedAt,
    updatedAt: dailyFeatures.updatedAt,
    primaryOfferId: dailyFeatures.primaryOfferId,
    book: {
      id: books.id,
      title: books.title,
      slug: books.slug,
      verdict: books.shortVerdict,
      summary: books.spoilerFreeSummary,
    },
    author: {
      id: authors.id,
      name: authors.name,
      slug: authors.slug,
    },
    editor: {
      id: editors.id,
      name: editors.displayName,
      slug: editors.slug,
      publicProfile: editors.publicProfile,
    },
    editionId: sql<string | null>`(
      select e.id from book_editions e
      where e.book_id = ${books.id} and e.active and e.deleted_at is null
      order by e.updated_at desc limit 1
    )`,
    cover: {
      id: sql<string | null>`(
        select m.id from book_editions e
        join media_assets m on m.id = e.cover_asset_id and m.deleted_at is null
        where e.book_id = ${books.id} and e.active and e.deleted_at is null
        order by e.updated_at desc limit 1
      )`,
      altText: sql<string | null>`(
        select m.alt_text from book_editions e
        join media_assets m on m.id = e.cover_asset_id and m.deleted_at is null
        where e.book_id = ${books.id} and e.active and e.deleted_at is null
        order by e.updated_at desc limit 1
      )`,
      width: sql<number | null>`(
        select m.width from book_editions e
        join media_assets m on m.id = e.cover_asset_id and m.deleted_at is null
        where e.book_id = ${books.id} and e.active and e.deleted_at is null
        order by e.updated_at desc limit 1
      )`,
      height: sql<number | null>`(
        select m.height from book_editions e
        join media_assets m on m.id = e.cover_asset_id and m.deleted_at is null
        where e.book_id = ${books.id} and e.active and e.deleted_at is null
        order by e.updated_at desc limit 1
      )`,
    },
  };
}

async function selectFeatureRows(
  db: Database,
  conditions: SQL[],
  limit: number,
) {
  return db
    .select(dailyFeatureSelection())
    .from(dailyFeatures)
    .innerJoin(books, eq(books.id, dailyFeatures.bookId))
    .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .innerJoin(editors, eq(editors.id, dailyFeatures.editorId))
    .where(and(...publicDailyConditions, ...conditions))
    .orderBy(desc(dailyFeatures.featureDate))
    .limit(limit);
}

function hasCompletePublicFeature(row: Awaited<ReturnType<typeof selectFeatureRows>>[number]) {
  return Boolean(
    row.headline?.trim() &&
      row.whyToday?.trim() &&
      row.audienceNote?.trim() &&
      row.caveat?.trim() &&
      row.fitPoints.length >= 3 &&
      row.book.verdict?.trim() &&
      row.cover.id &&
      row.cover.altText?.trim() &&
      row.cover.width &&
      row.cover.height,
  );
}

export async function getPublicDailyFeatureByDate(
  date: string,
  db: Database = getDb(),
) {
  const [row] = await selectFeatureRows(db, [eq(dailyFeatures.featureDate, date)], 1);
  if (!row || !hasCompletePublicFeature(row)) return null;
  return {
    ...row,
    fitPoints: row.fitPoints.slice(0, 3),
    offers: await listPublicCommercialOffersForBook(
      row.book.id,
      { preferredOfferId: row.primaryOfferId },
      db,
    ),
  };
}

export async function getCurrentPublicDailyFeature(db: Database = getDb()) {
  const date = getEditorialDate();
  return { date, feature: await getPublicDailyFeatureByDate(date, db) };
}

export async function listPublicDailyFeatures(
  filters: DailyArchiveFilters = {},
  db: Database = getDb(),
  limit = 240,
) {
  const conditions: SQL[] = [];
  if (filters.year) conditions.push(sql`extract(year from ${dailyFeatures.featureDate}) = ${filters.year}`);
  if (filters.month) conditions.push(sql`extract(month from ${dailyFeatures.featureDate}) = ${filters.month}`);
  if (filters.editorId) conditions.push(eq(dailyFeatures.editorId, filters.editorId));
  if (filters.genre) {
    conditions.push(sql`exists (
      select 1 from book_genres bg
      join genres g on g.id = bg.genre_id
      where bg.book_id = ${books.id}
        and g.slug = ${filters.genre}
        and g.status = 'published'
        and g.deleted_at is null
    )`);
  }

  const rows = await selectFeatureRows(db, conditions, Math.min(Math.max(limit, 1), 50_000));
  return rows.filter(hasCompletePublicFeature).map((row) => ({
    ...row,
    fitPoints: row.fitPoints.slice(0, 3),
  }));
}

export async function getDailyArchiveFilterOptions(db: Database = getDb()) {
  const [yearRows, editorRows, genreRows] = await Promise.all([
    db.selectDistinct({ year: sql<number>`extract(year from ${dailyFeatures.featureDate})::int` })
      .from(dailyFeatures)
      .where(and(eq(dailyFeatures.status, "published"), isNull(dailyFeatures.deletedAt)))
      .orderBy(desc(sql`extract(year from ${dailyFeatures.featureDate})::int`)),
    db.selectDistinct({ id: editors.id, name: editors.displayName })
      .from(dailyFeatures)
      .innerJoin(editors, eq(editors.id, dailyFeatures.editorId))
      .where(and(eq(dailyFeatures.status, "published"), isNull(dailyFeatures.deletedAt), isNull(editors.deletedAt)))
      .orderBy(editors.displayName),
    db.selectDistinct({ slug: genres.slug, name: genres.name })
      .from(dailyFeatures)
      .innerJoin(books, eq(books.id, dailyFeatures.bookId))
      .innerJoin(bookGenres, eq(bookGenres.bookId, books.id))
      .innerJoin(genres, eq(genres.id, bookGenres.genreId))
      .where(and(
        eq(dailyFeatures.status, "published"),
        isNull(dailyFeatures.deletedAt),
        eq(genres.status, "published"),
        isNull(genres.deletedAt),
      ))
      .orderBy(genres.name),
  ]);
  return { years: yearRows.map((row) => row.year), editors: editorRows, genres: genreRows };
}

export type PublicDailyFeature = NonNullable<Awaited<ReturnType<typeof getPublicDailyFeatureByDate>>>;
export type DailyArchiveItem = Awaited<ReturnType<typeof listPublicDailyFeatures>>[number];
