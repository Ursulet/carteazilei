import "server-only";

import { and, desc, eq, inArray, isNotNull, isNull, ne, sql } from "drizzle-orm";

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
  editorialReviews,
  genres,
  mediaAssets,
  moods,
  readingTraits,
  themes,
} from "@/db/schema";
import type { RecommendationCandidate } from "@/domain/recommendation/engine-types";

export const MINIMUM_RECOMMENDATION_EDITORIAL_CONFIDENCE = 60;

/**
 * Încarcă exclusiv cărți publice, cu ediție/copertă și analiză publicată.
 * Ofertele comerciale nu sunt importate și nu pot participa la candidate generation.
 */
export async function getRecommendationCandidates(
  referenceBookId?: string | null,
  db: Database = getDb(),
): Promise<RecommendationCandidate[]> {
  const baseRows = await db
    .select({
      id: books.id,
      title: books.title,
      slug: books.slug,
      shortVerdict: books.shortVerdict,
      editorialConfidence: books.editorialConfidence,
      editorialUpdatedAt: books.updatedAt,
      authorId: authors.id,
      authorName: authors.name,
      authorSlug: authors.slug,
      pageCount: bookEditions.pageCount,
      coverId: mediaAssets.id,
      coverAltText: mediaAssets.altText,
      coverWidth: mediaAssets.width,
      coverHeight: mediaAssets.height,
      whyRead: editorialReviews.whyRead,
      whyNot: editorialReviews.whyNot,
      caveats: editorialReviews.caveats,
    })
    .from(books)
    .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .innerJoin(bookEditions, eq(bookEditions.bookId, books.id))
    .innerJoin(mediaAssets, eq(mediaAssets.id, bookEditions.coverAssetId))
    .innerJoin(editorialReviews, eq(editorialReviews.bookId, books.id))
    .where(
      and(
        eq(books.status, "published"),
        isNull(books.deletedAt),
        sql`${books.editorialConfidence} >= ${MINIMUM_RECOMMENDATION_EDITORIAL_CONFIDENCE}`,
        sql`nullif(btrim(${books.shortVerdict}), '') is not null`,
        eq(authors.status, "published"),
        isNull(authors.deletedAt),
        eq(bookEditions.active, true),
        isNull(bookEditions.deletedAt),
        sql`${bookEditions.id} = (
          select selected_edition.id from book_editions selected_edition
          where selected_edition.book_id = ${books.id}
            and selected_edition.active
            and selected_edition.deleted_at is null
          order by selected_edition.updated_at desc
          limit 1
        )`,
        isNull(mediaAssets.deletedAt),
        isNotNull(mediaAssets.width),
        isNotNull(mediaAssets.height),
        sql`nullif(btrim(${mediaAssets.altText}), '') is not null`,
        eq(editorialReviews.status, "published"),
        isNull(editorialReviews.deletedAt),
        sql`${editorialReviews.id} = (
          select selected_review.id from editorial_reviews selected_review
          where selected_review.book_id = ${books.id}
            and selected_review.status = 'published'
            and selected_review.deleted_at is null
          order by selected_review.updated_at desc
          limit 1
        )`,
        sql`cardinality(${editorialReviews.caveats}) > 0`,
      ),
    )
    .orderBy(desc(books.editorialConfidence), books.title);

  const eligibleRows = baseRows.filter(
    (row) =>
      row.shortVerdict &&
      row.coverWidth &&
      row.coverHeight &&
      (!referenceBookId || row.id !== referenceBookId),
  );
  if (!eligibleRows.length) return [];
  const ids = eligibleRows.map((row) => row.id);

  const [genreRows, moodRows, themeRows, traitRows, audienceRows, relationRows] =
    await Promise.all([
      db
        .select({
          bookId: bookGenres.bookId,
          id: genres.id,
          name: genres.name,
          slug: genres.slug,
          isPrimary: bookGenres.isPrimary,
        })
        .from(bookGenres)
        .innerJoin(genres, eq(genres.id, bookGenres.genreId))
        .where(
          and(
            inArray(bookGenres.bookId, ids),
            ne(genres.status, "archived"),
            isNull(genres.deletedAt),
          ),
        ),
      db
        .select({
          bookId: bookMoods.bookId,
          slug: moods.slug,
          name: moods.name,
          strength: bookMoods.strength,
        })
        .from(bookMoods)
        .innerJoin(moods, eq(moods.id, bookMoods.moodId))
        .where(
          and(
            inArray(bookMoods.bookId, ids),
            ne(moods.status, "archived"),
            isNull(moods.deletedAt),
          ),
        ),
      db
        .select({ bookId: bookThemes.bookId, slug: themes.slug, name: themes.name })
        .from(bookThemes)
        .innerJoin(themes, eq(themes.id, bookThemes.themeId))
        .where(
          and(
            inArray(bookThemes.bookId, ids),
            ne(themes.status, "archived"),
            isNull(themes.deletedAt),
          ),
        ),
      db
        .select({
          bookId: bookTraitScores.bookId,
          code: readingTraits.code,
          score: bookTraitScores.score,
          confidence: bookTraitScores.confidence,
        })
        .from(bookTraitScores)
        .innerJoin(readingTraits, eq(readingTraits.id, bookTraitScores.traitId))
        .where(
          and(inArray(bookTraitScores.bookId, ids), eq(readingTraits.active, true)),
        ),
      db
        .select({
          bookId: bookAudiences.bookId,
          slug: audiences.slug,
          minimumAge: audiences.minimumAge,
          maximumAge: audiences.maximumAge,
        })
        .from(bookAudiences)
        .innerJoin(audiences, eq(audiences.id, bookAudiences.audienceId))
        .where(
          and(
            inArray(bookAudiences.bookId, ids),
            ne(audiences.status, "archived"),
            isNull(audiences.deletedAt),
          ),
        ),
      referenceBookId
        ? db
            .select({
              targetBookId: bookRelationships.targetBookId,
              type: bookRelationships.type,
              strength: bookRelationships.strength,
              reason: bookRelationships.publicReason,
            })
            .from(bookRelationships)
            .where(
              and(
                eq(bookRelationships.sourceBookId, referenceBookId),
                inArray(bookRelationships.targetBookId, ids),
                eq(bookRelationships.active, true),
                isNotNull(bookRelationships.approvedAt),
                isNotNull(bookRelationships.approvedBy),
                sql`nullif(btrim(${bookRelationships.publicReason}), '') is not null`,
              ),
            )
        : Promise.resolve([]),
    ]);

  const group = <T extends { bookId: string }>(rows: T[]) => {
    const result = new Map<string, Omit<T, "bookId">[]>();
    for (const { bookId, ...value } of rows) {
      result.set(bookId, [...(result.get(bookId) ?? []), value]);
    }
    return result;
  };
  const genresByBook = group(genreRows);
  const moodsByBook = group(moodRows);
  const themesByBook = group(themeRows);
  const traitsByBook = group(traitRows);
  const audiencesByBook = group(audienceRows);
  const relationsByBook = new Map<string, RecommendationCandidate["referenceRelations"]>();
  for (const relation of relationRows) {
    if (!relation.reason) continue;
    relationsByBook.set(relation.targetBookId, [
      ...(relationsByBook.get(relation.targetBookId) ?? []),
      { type: relation.type, strength: relation.strength, reason: relation.reason },
    ]);
  }

  return eligibleRows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    shortVerdict: row.shortVerdict!,
    editorialConfidence: row.editorialConfidence,
    editorialUpdatedAt: row.editorialUpdatedAt,
    author: { id: row.authorId, name: row.authorName, slug: row.authorSlug },
    edition: {
      pageCount: row.pageCount,
      cover: {
        id: row.coverId,
        altText: row.coverAltText,
        width: row.coverWidth!,
        height: row.coverHeight!,
      },
    },
    review: { whyRead: row.whyRead, whyNot: row.whyNot, caveats: row.caveats },
    genres: genresByBook.get(row.id) ?? [],
    moods: moodsByBook.get(row.id) ?? [],
    themes: themesByBook.get(row.id) ?? [],
    traits: traitsByBook.get(row.id) ?? [],
    audiences: audiencesByBook.get(row.id) ?? [],
    referenceRelations: relationsByBook.get(row.id) ?? [],
  }));
}
