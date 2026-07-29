import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";

import type { Database } from "@/db";
import { authors, books } from "@/db/schema";

const MINIMUM_QUERY_LENGTH = 2;
const MAXIMUM_QUERY_LENGTH = 120;
const MAXIMUM_RESULT_LIMIT = 30;

export type SearchPublishedBooksOptions = {
  query: string;
  limit?: number;
};

export async function searchPublishedBooks(
  db: Database,
  { query, limit = 10 }: SearchPublishedBooksOptions,
) {
  const searchTerm = query.trim().slice(0, MAXIMUM_QUERY_LENGTH);

  if (searchTerm.length < MINIMUM_QUERY_LENGTH) {
    return [];
  }

  const resultLimit = Math.min(Math.max(limit, 1), MAXIMUM_RESULT_LIMIT);
  const normalizedQuery = sql<string>`unaccent(lower(${searchTerm}))`;
  const titleNormalized = sql<string>`unaccent(lower(${books.title}))`;
  const authorNormalized = sql<string>`unaccent(lower(${authors.name}))`;
  const prefixQuery = sql<string>`${normalizedQuery} || '%'`;
  const textQuery = sql`websearch_to_tsquery('simple', unaccent(${searchTerm}))`;

  const score = sql<number>`(
    case
      when ${titleNormalized} = ${normalizedQuery} then 100
      when ${titleNormalized} like ${prefixQuery} then 80
      when ${authorNormalized} = ${normalizedQuery} then 75
      when ${authorNormalized} like ${prefixQuery} then 65
      else 0
    end
    + greatest(similarity(${books.searchText}, ${normalizedQuery}), 0) * 25
    + ts_rank_cd(${books.searchDocument}, ${textQuery}) * 20
  )`;

  return db
    .select({
      id: books.id,
      title: books.title,
      subtitle: books.subtitle,
      slug: books.slug,
      shortVerdict: books.shortVerdict,
      author: {
        id: authors.id,
        name: authors.name,
        slug: authors.slug,
      },
      score,
    })
    .from(books)
    .innerJoin(authors, eq(books.primaryAuthorId, authors.id))
    .where(
      and(
        eq(books.status, "published"),
        isNull(books.deletedAt),
        eq(authors.status, "published"),
        isNull(authors.deletedAt),
        or(
          sql`${titleNormalized} like ${prefixQuery}`,
          sql`${authorNormalized} like ${prefixQuery}`,
          sql`${books.searchText} % ${normalizedQuery}`,
          sql`${books.searchDocument} @@ ${textQuery}`,
        ),
      ),
    )
    .orderBy(desc(score), asc(books.title))
    .limit(resultLimit);
}

