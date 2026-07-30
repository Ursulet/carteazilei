import "server-only";

import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  audiences,
  authors,
  bookAudiences,
  bookEditions,
  bookGenres,
  bookMoods,
  bookRelationships,
  books,
  bookThemes,
  bookTraitScores,
  editorialListBooks,
  editorialLists,
  editorialReviews,
  editors,
  genres,
  mediaAssets,
  moods,
  readingTraits,
  seoMetadata,
  themes,
} from "@/db/schema";
import { listPublicCommercialOffersForBook } from "@/db/queries/public-commercial-offers";

export const publishedBookConditions = and(
  eq(books.status, "published"),
  isNull(books.deletedAt),
  eq(authors.status, "published"),
  isNull(authors.deletedAt),
);

export const publicBookPageEligibility = sql`exists (
    select 1 from book_editions eligible_edition
    join media_assets eligible_cover on eligible_cover.id = eligible_edition.cover_asset_id
      and eligible_cover.deleted_at is null
    where eligible_edition.book_id = ${books.id}
      and eligible_edition.active
      and eligible_edition.deleted_at is null
      and nullif(btrim(eligible_cover.alt_text), '') is not null
      and eligible_cover.width is not null
      and eligible_cover.height is not null
  ) and exists (
    select 1 from editorial_reviews eligible_review
    where eligible_review.book_id = ${books.id}
      and eligible_review.status = 'published'
      and eligible_review.deleted_at is null
      and nullif(btrim(eligible_review.verdict), '') is not null
      and cardinality(eligible_review.caveats) > 0
  ) and nullif(btrim(${books.spoilerFreeSummary}), '') is not null`;

function coverSelection() {
  return {
    id: mediaAssets.id,
    altText: mediaAssets.altText,
    width: mediaAssets.width,
    height: mediaAssets.height,
    attribution: mediaAssets.attribution,
    source: mediaAssets.source,
    sourceUrl: mediaAssets.sourceUrl,
  };
}

export function bookCardSelection() {
  const outerBookId = sql.raw('"books"."id"');
  return {
    id: books.id,
    title: books.title,
    slug: books.slug,
    verdict: books.shortVerdict,
    authorId: authors.id,
    author: authors.name,
    cover: {
      id: sql<string | null>`(select m.id from book_editions e join media_assets m on m.id = e.cover_asset_id and m.deleted_at is null where e.book_id = ${outerBookId} and e.active and e.deleted_at is null order by e.updated_at desc limit 1)`,
      altText: sql<string | null>`(select m.alt_text from book_editions e join media_assets m on m.id = e.cover_asset_id and m.deleted_at is null where e.book_id = ${outerBookId} and e.active and e.deleted_at is null order by e.updated_at desc limit 1)`,
      width: sql<number | null>`(select m.width from book_editions e join media_assets m on m.id = e.cover_asset_id and m.deleted_at is null where e.book_id = ${outerBookId} and e.active and e.deleted_at is null order by e.updated_at desc limit 1)`,
      height: sql<number | null>`(select m.height from book_editions e join media_assets m on m.id = e.cover_asset_id and m.deleted_at is null where e.book_id = ${outerBookId} and e.active and e.deleted_at is null order by e.updated_at desc limit 1)`,
    },
  };
}

export async function getBookCardById(db: Database, id: string) {
  const [row] = await db
    .select(bookCardSelection())
    .from(books)
    .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .where(and(eq(books.id, id), publishedBookConditions, publicBookPageEligibility))
    .limit(1);
  return row ?? null;
}

export async function getBookRelations(db: Database, bookId: string, limit = 12) {
  const rows = await db
    .select({
      targetBookId: bookRelationships.targetBookId,
      type: bookRelationships.type,
      nextReadBasis: bookRelationships.nextReadBasis,
      reason: bookRelationships.publicReason,
      strength: bookRelationships.strength,
    })
    .from(bookRelationships)
    .where(and(
      eq(bookRelationships.sourceBookId, bookId),
      eq(bookRelationships.active, true),
      isNotNull(bookRelationships.approvedAt),
      isNotNull(bookRelationships.approvedBy),
      sql`nullif(btrim(${bookRelationships.publicReason}), '') is not null`,
    ))
    .orderBy(desc(bookRelationships.strength))
    .limit(Math.min(Math.max(limit, 1), 100));
  const hydrated = await Promise.all(rows.map(async (relationship) => {
    const target = await getBookCardById(db, relationship.targetBookId);
    return target && relationship.reason ? { ...relationship, target } : null;
  }));
  return hydrated.filter((row): row is NonNullable<typeof row> => row !== null);
}

export async function getPublicBookPage(slug: string, db: Database = getDb()) {
  const [base] = await db
    .select({
      book: {
        id: books.id,
        title: books.title,
        subtitle: books.subtitle,
        slug: books.slug,
        originalTitle: books.originalTitle,
        verdict: books.shortVerdict,
        summary: books.spoilerFreeSummary,
        confidence: books.editorialConfidence,
        publishedAt: books.publishedAt,
        updatedAt: books.updatedAt,
      },
      author: {
        id: authors.id,
        name: authors.name,
        slug: authors.slug,
        bio: authors.bio,
        portraitId: sql<string | null>`(select m.id from media_assets m where m.id = ${authors.portraitAssetId} and m.deleted_at is null limit 1)`,
        portraitAltText: sql<string | null>`(select m.alt_text from media_assets m where m.id = ${authors.portraitAssetId} and m.deleted_at is null limit 1)`,
        portraitWidth: sql<number | null>`(select m.width from media_assets m where m.id = ${authors.portraitAssetId} and m.deleted_at is null limit 1)`,
        portraitHeight: sql<number | null>`(select m.height from media_assets m where m.id = ${authors.portraitAssetId} and m.deleted_at is null limit 1)`,
      },
      seo: {
        title: seoMetadata.titleOverride,
        description: seoMetadata.descriptionOverride,
        canonical: seoMetadata.canonicalOverride,
        indexable: seoMetadata.indexable,
      },
    })
    .from(books)
    .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .leftJoin(seoMetadata, and(eq(seoMetadata.entityType, "book"), eq(seoMetadata.entityId, books.id)))
    .where(and(eq(books.slug, slug), publishedBookConditions, publicBookPageEligibility))
    .limit(1);
  if (!base) return null;

  const [editionRows, reviewRows, genreRows, themeRows, moodRows, audienceRows, traitRows, listRows, relations] = await Promise.all([
    db.select({
      id: bookEditions.id,
      isbn10: bookEditions.isbn10,
      isbn13: bookEditions.isbn13,
      publisher: bookEditions.publisher,
      publicationYear: bookEditions.publicationYear,
      publicationDate: bookEditions.publicationDate,
      language: bookEditions.language,
      pageCount: bookEditions.pageCount,
      label: bookEditions.editionLabel,
      cover: coverSelection(),
    }).from(bookEditions).innerJoin(mediaAssets, eq(mediaAssets.id, bookEditions.coverAssetId))
      .where(and(eq(bookEditions.bookId, base.book.id), eq(bookEditions.active, true), isNull(bookEditions.deletedAt), isNull(mediaAssets.deletedAt)))
      .orderBy(desc(bookEditions.updatedAt)).limit(1),
    db.select({
      verdict: editorialReviews.verdict,
      whyRead: editorialReviews.whyRead,
      whyNot: editorialReviews.whyNot,
      strengths: editorialReviews.strengths,
      caveats: editorialReviews.caveats,
      reviewedAt: editorialReviews.reviewedAt,
      publishedAt: editorialReviews.publishedAt,
      editor: { name: editors.displayName, slug: editors.slug, publicProfile: editors.publicProfile },
    }).from(editorialReviews).innerJoin(editors, eq(editors.id, editorialReviews.editorId))
      .where(and(eq(editorialReviews.bookId, base.book.id), eq(editorialReviews.status, "published"), isNull(editorialReviews.deletedAt), isNull(editors.deletedAt)))
      .orderBy(desc(editorialReviews.updatedAt)).limit(1),
    db.select({ id: genres.id, name: genres.name, slug: genres.slug }).from(bookGenres)
      .innerJoin(genres, eq(genres.id, bookGenres.genreId))
      .where(and(eq(bookGenres.bookId, base.book.id), eq(genres.status, "published"), isNull(genres.deletedAt)))
      .orderBy(desc(bookGenres.isPrimary), asc(genres.name)),
    db.select({ id: themes.id, name: themes.name, slug: themes.slug }).from(bookThemes)
      .innerJoin(themes, eq(themes.id, bookThemes.themeId))
      .where(and(eq(bookThemes.bookId, base.book.id), eq(themes.status, "published"), isNull(themes.deletedAt)))
      .orderBy(asc(themes.name)),
    db.select({ id: moods.id, name: moods.name, slug: moods.slug, strength: bookMoods.strength }).from(bookMoods)
      .innerJoin(moods, eq(moods.id, bookMoods.moodId))
      .where(and(eq(bookMoods.bookId, base.book.id), eq(moods.status, "published"), isNull(moods.deletedAt)))
      .orderBy(desc(bookMoods.strength), asc(moods.name)),
    db.select({ id: audiences.id, name: audiences.name, slug: audiences.slug, description: audiences.description }).from(bookAudiences)
      .innerJoin(audiences, eq(audiences.id, bookAudiences.audienceId))
      .where(and(eq(bookAudiences.bookId, base.book.id), eq(audiences.status, "published"), isNull(audiences.deletedAt)))
      .orderBy(asc(audiences.name)),
    db.select({ code: readingTraits.code, name: readingTraits.name, score: bookTraitScores.score, confidence: bookTraitScores.confidence }).from(bookTraitScores)
      .innerJoin(readingTraits, eq(readingTraits.id, bookTraitScores.traitId))
      .where(and(eq(bookTraitScores.bookId, base.book.id), eq(readingTraits.active, true)))
      .orderBy(asc(readingTraits.name)),
    db.select({ title: editorialLists.title, slug: editorialLists.slug, reason: editorialListBooks.reason }).from(editorialListBooks)
      .innerJoin(editorialLists, eq(editorialLists.id, editorialListBooks.listId))
      .where(and(eq(editorialListBooks.bookId, base.book.id), eq(editorialLists.status, "published"), eq(editorialLists.indexable, true), isNull(editorialLists.deletedAt)))
      .orderBy(asc(editorialLists.title)).limit(8),
    getBookRelations(db, base.book.id),
  ]);
  const edition = editionRows[0];
  const review = reviewRows[0];
  if (!edition || !review || !base.book.verdict || !base.book.summary) return null;
  const offers = await listPublicCommercialOffersForBook(base.book.id, {}, db);
  return {
    ...base,
    author: {
      id: base.author.id,
      name: base.author.name,
      slug: base.author.slug,
      bio: base.author.bio,
      portrait: {
        id: base.author.portraitId,
        altText: base.author.portraitAltText,
        width: base.author.portraitWidth,
        height: base.author.portraitHeight,
      },
    },
    edition,
    review,
    genres: genreRows,
    themes: themeRows,
    moods: moodRows,
    audiences: audienceRows,
    traits: traitRows,
    lists: listRows,
    similarBooks: relations.filter((relation) => relation.type.startsWith("similar_")),
    nextReads: relations.filter((relation) => relation.type === "next_read"),
    offers,
  };
}

export async function listPublicBookCards(db: Database = getDb(), limit = 96) {
  return db
    .select(bookCardSelection())
    .from(books)
    .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .where(and(publishedBookConditions, publicBookPageEligibility))
    .orderBy(asc(books.title))
    .limit(Math.min(Math.max(limit, 1), 100));
}

export async function listLatestPublicBookCards(db: Database = getDb(), limit = 4) {
  return db
    .select(bookCardSelection())
    .from(books)
    .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .where(and(publishedBookConditions, publicBookPageEligibility))
    .orderBy(desc(books.publishedAt), desc(books.updatedAt), asc(books.title))
    .limit(Math.min(Math.max(limit, 1), 12));
}

export async function listPublicBookCardsByAuthor(authorId: string, db: Database = getDb()) {
  return db
    .select(bookCardSelection())
    .from(books)
    .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .where(and(eq(books.primaryAuthorId, authorId), publishedBookConditions, publicBookPageEligibility))
    .orderBy(asc(books.title))
    .limit(100);
}

export type PublicBookPage = NonNullable<Awaited<ReturnType<typeof getPublicBookPage>>>;
export type PublicBookCard = Awaited<ReturnType<typeof listPublicBookCards>>[number];
