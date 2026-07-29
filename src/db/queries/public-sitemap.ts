import "server-only";

import { and, eq, exists, isNull, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  authors,
  books,
  editors,
  seoMetadata,
} from "@/db/schema";
import { absolutePublicUrl } from "@/lib/seo/urls";

import { publicBookPageEligibility } from "./public-book-pages";
import { listPublicDailyFeatures } from "./public-daily-features";
import { listIndexableSeoHubEntries } from "./public-seo-hubs";

function hasOwnCanonical(canonical: string | null, href: string) {
  if (!canonical) return true;
  return new URL(canonical, absolutePublicUrl("/")).toString() === absolutePublicUrl(href);
}

/** Returnează numai URL-uri publice care îndeplinesc criteriile propriei pagini. */
export async function getPublicSitemapEntries(db: Database = getDb()) {
  const [bookRows, authorRows, editorRows, dailyRows, hubRows] = await Promise.all([
    db
      .select({ slug: books.slug, updatedAt: books.updatedAt, canonical: seoMetadata.canonicalOverride })
      .from(books)
      .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
      .innerJoin(seoMetadata, and(eq(seoMetadata.entityType, "book"), eq(seoMetadata.entityId, books.id)))
      .where(and(eq(books.status, "published"), isNull(books.deletedAt), eq(authors.status, "published"), isNull(authors.deletedAt), eq(seoMetadata.indexable, true), publicBookPageEligibility)),
    db
      .select({ slug: authors.slug, updatedAt: authors.updatedAt, canonical: seoMetadata.canonicalOverride })
      .from(authors)
      .innerJoin(seoMetadata, and(eq(seoMetadata.entityType, "author"), eq(seoMetadata.entityId, authors.id)))
      .where(and(
        eq(authors.status, "published"),
        isNull(authors.deletedAt),
        eq(seoMetadata.indexable, true),
        exists(db.select({ value: sql`1` }).from(books).where(and(eq(books.primaryAuthorId, authors.id), eq(books.status, "published"), isNull(books.deletedAt), publicBookPageEligibility))),
      )),
    db
      .select({ slug: editors.slug, updatedAt: editors.updatedAt })
      .from(editors)
      .where(and(
        eq(editors.publicProfile, true),
        isNull(editors.deletedAt),
        sql`nullif(btrim(${editors.bio}), '') is not null`,
      )),
    listPublicDailyFeatures({}, db, 50_000),
    listIndexableSeoHubEntries(db),
  ]);
  return {
    books: bookRows.flatMap((row) => {
      const href = `/carte/${row.slug}`;
      return hasOwnCanonical(row.canonical, href) ? [{ href, lastModified: row.updatedAt }] : [];
    }),
    authors: authorRows.flatMap((row) => {
      const href = `/autor/${row.slug}`;
      return hasOwnCanonical(row.canonical, href) ? [{ href, lastModified: row.updatedAt }] : [];
    }),
    editors: editorRows.map((row) => ({ href: `/editor/${row.slug}`, lastModified: row.updatedAt })),
    daily: dailyRows.map((row) => ({ href: `/cartea-zilei/${row.featureDate}`, lastModified: row.updatedAt })),
    hubs: hubRows,
  };
}
