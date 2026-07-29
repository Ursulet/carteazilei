import "server-only";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  authors,
  books,
  dailyFeatures,
  editorialLists,
  editorialReviews,
  editors,
  mediaAssets,
} from "@/db/schema";

import { bookCardSelection, publicBookPageEligibility, publishedBookConditions } from "./public-book-pages";
import { getPublicEditorialListPage } from "./public-seo-hubs";

function publicEditorSelection() {
  return {
    id: editors.id,
    name: editors.displayName,
    slug: editors.slug,
    bio: editors.bio,
    expertise: editors.expertise,
    avatar: {
      id: mediaAssets.id,
      altText: mediaAssets.altText,
      width: mediaAssets.width,
      height: mediaAssets.height,
    },
    reviewCount: sql<number>`(
      select count(*)::int from editorial_reviews trust_review
      where trust_review.editor_id = ${editors.id}
        and trust_review.status = 'published' and trust_review.deleted_at is null
    )`,
    dailyFeatureCount: sql<number>`(
      select count(*)::int from daily_features trust_daily
      where trust_daily.editor_id = ${editors.id}
        and trust_daily.status = 'published' and trust_daily.deleted_at is null
    )`,
  };
}

function withAvatarFallback<T extends { avatar: { id: string; altText: string; width: number | null; height: number | null } | null }>(row: T) {
  return {
    ...row,
    avatar: row.avatar ?? { id: null, altText: null, width: null, height: null },
  };
}

export async function listPublicEditors(db: Database = getDb()) {
  const rows = await db
    .select(publicEditorSelection())
    .from(editors)
    .leftJoin(mediaAssets, and(eq(mediaAssets.id, editors.avatarAssetId), isNull(mediaAssets.deletedAt)))
    .where(and(
      eq(editors.publicProfile, true),
      isNull(editors.deletedAt),
      sql`nullif(btrim(${editors.bio}), '') is not null`,
    ))
    .orderBy(asc(editors.displayName));
  return rows.map(withAvatarFallback);
}

export async function getPublicEditorProfile(slug: string, db: Database = getDb()) {
  const [editor] = await db
    .select(publicEditorSelection())
    .from(editors)
    .leftJoin(mediaAssets, and(eq(mediaAssets.id, editors.avatarAssetId), isNull(mediaAssets.deletedAt)))
    .where(and(
      eq(editors.slug, slug),
      eq(editors.publicProfile, true),
      isNull(editors.deletedAt),
      sql`nullif(btrim(${editors.bio}), '') is not null`,
    ))
    .limit(1);
  if (!editor) return null;
  const normalizedEditor = withAvatarFallback(editor);

  const [reviewedBooks, dailySelections, listCandidates] = await Promise.all([
    db
      .selectDistinct(bookCardSelection())
      .from(editorialReviews)
      .innerJoin(books, eq(books.id, editorialReviews.bookId))
      .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
      .where(and(
        eq(editorialReviews.editorId, normalizedEditor.id),
        eq(editorialReviews.status, "published"),
        isNull(editorialReviews.deletedAt),
        publishedBookConditions,
        publicBookPageEligibility,
      ))
      .orderBy(asc(books.title))
      .limit(24),
    db
      .select({
        id: dailyFeatures.id,
        date: dailyFeatures.featureDate,
        title: books.title,
        slug: books.slug,
        headline: dailyFeatures.headline,
      })
      .from(dailyFeatures)
      .innerJoin(books, eq(books.id, dailyFeatures.bookId))
      .where(and(
        eq(dailyFeatures.editorId, normalizedEditor.id),
        eq(dailyFeatures.status, "published"),
        isNull(dailyFeatures.deletedAt),
        eq(books.status, "published"),
        isNull(books.deletedAt),
      ))
      .orderBy(desc(dailyFeatures.featureDate))
      .limit(12),
    db
      .select({ slug: editorialLists.slug, type: editorialLists.type })
      .from(editorialLists)
      .where(and(
        eq(editorialLists.editorId, normalizedEditor.id),
        eq(editorialLists.status, "published"),
        isNull(editorialLists.deletedAt),
      ))
      .orderBy(desc(editorialLists.publishedAt))
      .limit(12),
  ]);

  const lists = (await Promise.all(
    listCandidates.map((list) => getPublicEditorialListPage(
      list.slug,
      list.type === "length_hub" ? "length" : "list",
      db,
    )),
  )).flatMap((list) => list?.quality.indexable ? [list] : []);

  return { editor: normalizedEditor, reviewedBooks, dailySelections, lists };
}

export type PublicEditorProfile = NonNullable<Awaited<ReturnType<typeof getPublicEditorProfile>>>;
