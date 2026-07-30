import "server-only";

import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  authors,
  books,
  editorialLists,
  editors,
  seoMetadata,
} from "@/db/schema";
import { getServerEnv } from "@/lib/env/server";

import {
  bookCardSelection,
  publicBookPageEligibility,
  publishedBookConditions,
} from "./public-book-pages";

const MAXIMUM_BOOK_LIMIT = 24;
const MAXIMUM_AUTHOR_LIMIT = 12;
const MAXIMUM_GUIDE_LIMIT = 12;

export type PublicSearchOptions = {
  bookLimit?: number;
  authorLimit?: number;
  guideLimit?: number;
};

function boundedLimit(value: number | undefined, fallback: number, maximum: number) {
  return Math.min(Math.max(value ?? fallback, 1), maximum);
}

/**
 * Caută în catalog într-o tranzacție scurtă, cu timeout local. Toate fragmentele
 * care provin din input sunt interpolate de Drizzle ca parametri PostgreSQL.
 */
export async function searchPublicCatalog(
  query: string,
  options: PublicSearchOptions = {},
  db: Database = getDb(),
) {
  const bookLimit = boundedLimit(options.bookLimit, 12, MAXIMUM_BOOK_LIMIT);
  const authorLimit = boundedLimit(options.authorLimit, 6, MAXIMUM_AUTHOR_LIMIT);
  const guideLimit = boundedLimit(options.guideLimit, 6, MAXIMUM_GUIDE_LIMIT);
  const minimumHubBooks = getServerEnv().SEO_HUB_MINIMUM_BOOKS;

  return db.transaction(async (transaction) => {
    await transaction.execute(sql.raw("set local statement_timeout = '900ms'"));

    const normalizedQuery = sql<string>`unaccent(lower(${query}))`;
    const titleNormalized = sql<string>`unaccent(lower(${books.title}))`;
    const authorNormalized = sql<string>`unaccent(lower(${authors.name}))`;
    const textQuery = sql`websearch_to_tsquery('simple', unaccent(${query}))`;
    const outerBookId = sql.raw('"books"."id"');

    const thematicExactMatch = sql<boolean>`(
      exists (
        select 1 from book_genres bg join genres g on g.id = bg.genre_id
        where bg.book_id = ${outerBookId} and g.status = 'published' and g.deleted_at is null
          and unaccent(lower(g.name)) = ${normalizedQuery}
      ) or exists (
        select 1 from book_themes bt join themes t on t.id = bt.theme_id
        where bt.book_id = ${outerBookId} and t.status = 'published' and t.deleted_at is null
          and unaccent(lower(t.name)) = ${normalizedQuery}
      ) or exists (
        select 1 from book_moods bm join moods m on m.id = bm.mood_id
        where bm.book_id = ${outerBookId} and m.status = 'published' and m.deleted_at is null
          and unaccent(lower(m.name)) = ${normalizedQuery}
      ) or exists (
        select 1 from book_audiences ba join audiences a on a.id = ba.audience_id
        where ba.book_id = ${outerBookId} and a.status = 'published' and a.deleted_at is null
          and unaccent(lower(a.name)) = ${normalizedQuery}
      )
    )`;

    const thematicMatch = sql<boolean>`(
      exists (
        select 1 from book_genres bg join genres g on g.id = bg.genre_id
        where bg.book_id = ${outerBookId} and g.status = 'published' and g.deleted_at is null
          and (
            position(${normalizedQuery} in unaccent(lower(concat_ws(' ', g.name, g.description, g.search_intent, g.editorial_intro)))) > 0
            or similarity(unaccent(lower(g.name)), ${normalizedQuery}) >= 0.25
          )
      ) or exists (
        select 1 from book_themes bt join themes t on t.id = bt.theme_id
        where bt.book_id = ${outerBookId} and t.status = 'published' and t.deleted_at is null
          and (
            position(${normalizedQuery} in unaccent(lower(concat_ws(' ', t.name, t.description, t.search_intent, t.editorial_intro)))) > 0
            or similarity(unaccent(lower(t.name)), ${normalizedQuery}) >= 0.25
          )
      ) or exists (
        select 1 from book_moods bm join moods m on m.id = bm.mood_id
        where bm.book_id = ${outerBookId} and m.status = 'published' and m.deleted_at is null
          and (
            position(${normalizedQuery} in unaccent(lower(concat_ws(' ', m.name, m.description, m.search_intent, m.editorial_intro)))) > 0
            or similarity(unaccent(lower(m.name)), ${normalizedQuery}) >= 0.25
          )
      ) or exists (
        select 1 from book_audiences ba join audiences a on a.id = ba.audience_id
        where ba.book_id = ${outerBookId} and a.status = 'published' and a.deleted_at is null
          and (
            position(${normalizedQuery} in unaccent(lower(concat_ws(' ', a.name, a.description, a.search_intent, a.editorial_intro)))) > 0
            or similarity(unaccent(lower(a.name)), ${normalizedQuery}) >= 0.25
          )
      )
    )`;

    const bookScore = sql<number>`(
      case
        when ${titleNormalized} = ${normalizedQuery} then 1000
        when left(${titleNormalized}, length(${normalizedQuery})) = ${normalizedQuery} then 800
        when ${authorNormalized} = ${normalizedQuery} then 650
        when left(${authorNormalized}, length(${normalizedQuery})) = ${normalizedQuery} then 600
        else 0
      end
      + greatest(similarity(${titleNormalized}, ${normalizedQuery}), 0) * 200
      + greatest(similarity(${authorNormalized}, ${normalizedQuery}), 0) * 40
      + ts_rank_cd(${books.searchDocument}, ${textQuery}) * 60
      + case when ${thematicExactMatch} then 24 when ${thematicMatch} then 14 else 0 end
    )`;

    const bookRows = await transaction
      .select({ ...bookCardSelection(), score: bookScore })
      .from(books)
      .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
      .where(
        and(
          publishedBookConditions,
          publicBookPageEligibility,
          sql`(
            ${titleNormalized} = ${normalizedQuery}
            or left(${titleNormalized}, length(${normalizedQuery})) = ${normalizedQuery}
            or ${authorNormalized} = ${normalizedQuery}
            or left(${authorNormalized}, length(${normalizedQuery})) = ${normalizedQuery}
            or similarity(${titleNormalized}, ${normalizedQuery}) >= 0.18
            or similarity(${authorNormalized}, ${normalizedQuery}) >= 0.3
            or ${books.searchDocument} @@ ${textQuery}
            or ${thematicMatch}
          )`,
        ),
      )
      .orderBy(desc(bookScore), asc(books.title))
      .limit(bookLimit);

    const authorScore = sql<number>`(
      case
        when ${authorNormalized} = ${normalizedQuery} then 100
        when left(${authorNormalized}, length(${normalizedQuery})) = ${normalizedQuery} then 80
        else 0
      end + greatest(similarity(${authorNormalized}, ${normalizedQuery}), 0) * 50
    )`;

    const authorRows = await transaction
      .select({
        id: authors.id,
        name: authors.name,
        slug: authors.slug,
        bio: authors.bio,
        bookCount: sql<number>`count(distinct "books"."id")::int`,
        score: authorScore,
      })
      .from(authors)
      .innerJoin(books, eq(books.primaryAuthorId, authors.id))
      .where(
        and(
          publishedBookConditions,
          publicBookPageEligibility,
          sql`(
            ${authorNormalized} = ${normalizedQuery}
            or left(${authorNormalized}, length(${normalizedQuery})) = ${normalizedQuery}
            or similarity(${authorNormalized}, ${normalizedQuery}) >= 0.25
          )`,
        ),
      )
      .groupBy(authors.id)
      .orderBy(desc(authorScore), asc(authors.name))
      .limit(authorLimit);

    const listTitleNormalized = sql<string>`unaccent(lower(${editorialLists.title}))`;
    const listDocument = sql`to_tsvector('simple', unaccent(concat_ws(' ', ${editorialLists.title}, ${editorialLists.intro}, ${editorialLists.methodology})))`;
    const guideScore = sql<number>`(
      case
        when ${listTitleNormalized} = ${normalizedQuery} then 100
        when left(${listTitleNormalized}, length(${normalizedQuery})) = ${normalizedQuery} then 80
        else 0
      end
      + greatest(similarity(${listTitleNormalized}, ${normalizedQuery}), 0) * 40
      + ts_rank_cd(${listDocument}, ${textQuery}) * 20
    )`;
    const eligibleSelectionCount = sql<number>`(
      select count(*)::int
      from editorial_list_books search_list_book
      join books search_book on search_book.id = search_list_book.book_id
      join authors search_author on search_author.id = search_book.primary_author_id
      where search_list_book.list_id = ${editorialLists.id}
        and nullif(btrim(search_list_book.reason), '') is not null
        and search_book.status = 'published'
        and search_book.deleted_at is null
        and search_author.status = 'published'
        and search_author.deleted_at is null
        and nullif(btrim(search_book.spoiler_free_summary), '') is not null
        and exists (
          select 1 from book_editions search_edition
          join media_assets search_cover on search_cover.id = search_edition.cover_asset_id
          where search_edition.book_id = search_book.id
            and search_edition.active and search_edition.deleted_at is null
            and search_cover.deleted_at is null
            and nullif(btrim(search_cover.alt_text), '') is not null
            and search_cover.width is not null and search_cover.height is not null
        )
        and exists (
          select 1 from editorial_reviews search_review
          where search_review.book_id = search_book.id
            and search_review.status = 'published' and search_review.deleted_at is null
            and nullif(btrim(search_review.verdict), '') is not null
            and cardinality(search_review.caveats) > 0
        )
    )`;

    const guideRows = await transaction
      .select({
        id: editorialLists.id,
        title: editorialLists.title,
        slug: editorialLists.slug,
        intro: editorialLists.intro,
        type: editorialLists.type,
        selectionCount: eligibleSelectionCount,
        score: guideScore,
      })
      .from(editorialLists)
      .innerJoin(editors, eq(editors.id, editorialLists.editorId))
      .innerJoin(
        seoMetadata,
        and(
          eq(seoMetadata.entityType, "editorial_list"),
          eq(seoMetadata.entityId, editorialLists.id),
        ),
      )
      .where(
        and(
          eq(editorialLists.status, "published"),
          eq(editorialLists.indexable, true),
          isNull(editorialLists.deletedAt),
          isNull(editors.deletedAt),
          eq(seoMetadata.indexable, true),
          inArray(editorialLists.type, ["list", "guide", "hub", "length_hub"]),
          sql`nullif(btrim(${editorialLists.intro}), '') is not null`,
          sql`nullif(btrim(${editorialLists.methodology}), '') is not null`,
          sql`nullif(btrim(${seoMetadata.titleOverride}), '') is not null`,
          sql`nullif(btrim(${seoMetadata.descriptionOverride}), '') is not null`,
          sql`${eligibleSelectionCount} >= ${minimumHubBooks}`,
          sql`(
            ${listTitleNormalized} = ${normalizedQuery}
            or left(${listTitleNormalized}, length(${normalizedQuery})) = ${normalizedQuery}
            or similarity(${listTitleNormalized}, ${normalizedQuery}) >= 0.2
            or ${listDocument} @@ ${textQuery}
          )`,
        ),
      )
      .orderBy(desc(guideScore), asc(editorialLists.title))
      .limit(guideLimit);

    return {
      books: bookRows,
      authors: authorRows,
      guides: guideRows.map((guide) => ({
        ...guide,
        href:
          guide.type === "length_hub"
            ? `/carti/lungime/${guide.slug}`
            : `/liste/${guide.slug}`,
        kindLabel:
          guide.type === "guide"
            ? "Ghid"
            : guide.type === "length_hub"
              ? "Selecție după lungime"
              : "Listă editorială",
      })),
    };
  });
}

export type PublicSearchResults = Awaited<ReturnType<typeof searchPublicCatalog>>;
