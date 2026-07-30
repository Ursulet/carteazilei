import "server-only";

import { and, asc, gte, isNull, lte, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import { authors, dailyFeatures } from "@/db/schema";
import { getEditorialDate } from "@/domain/editorial/bucharest-date";
import { getServerEnv } from "@/lib/env/server";

import {
  getAdminEditorialLists,
  getAdminTaxonomies,
} from "./admin-seo-hubs";
import {
  getPublicEditorialListPage,
  getPublicTaxonomyHub,
} from "./public-seo-hubs";

export const readinessIssueKinds = [
  "missing_caveat",
  "incomplete_traits",
  "missing_editor",
  "no_similar_relations",
  "no_retailer_offer",
  "stale_offer",
  "page_needs_review",
  "daily_calendar_gap",
  "seo_hub_below_gate",
] as const;

export type ReadinessIssueKind = (typeof readinessIssueKinds)[number];

export const readinessIssueLabels: Record<ReadinessIssueKind, string> = {
  missing_caveat: "Carte publicată fără rezervă editorială",
  incomplete_traits: "Profil de lectură incomplet sau nesigur",
  missing_editor: "Editor lipsă",
  no_similar_relations: "Fără relații similare aprobate",
  no_retailer_offer: "Fără ofertă activă",
  stale_offer: "Ofertă neverificată de peste 30 de zile",
  page_needs_review: "Pagină de carte care necesită revizie",
  daily_calendar_gap: "Gol în calendarul Cartea Zilei",
  seo_hub_below_gate: "Pagină SEO incompletă",
};

type BookReadinessDbRow = {
  id: string;
  title: string;
  author_name: string;
  status: string;
  updated_at: Date;
  issues: string[];
};

function addIsoDays(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day! + days));
  return date.toISOString().slice(0, 10);
}

async function getBookReadinessRows(db: Database) {
  const staleBefore = new Date(Date.now() - 30 * 24 * 60 * 60 * 1_000);
  const staleBeforeIso = staleBefore.toISOString();
  const rows = await db.execute(sql<BookReadinessDbRow>`
    select
      b.id,
      b.title,
      a.name as author_name,
      b.status,
      b.updated_at,
      array_remove(array[
        case when b.status = 'published'
          and (latest_review.id is null or cardinality(latest_review.caveats) = 0)
          then 'missing_caveat' end,
        case when
          (select count(*) from reading_traits trait where trait.active) > 0
          and (
            (select count(*) from book_trait_scores score
              join reading_traits trait on trait.id = score.trait_id and trait.active
              where score.book_id = b.id)
              < (select count(*) from reading_traits trait where trait.active)
            or exists (
              select 1 from book_trait_scores score
              join reading_traits trait on trait.id = score.trait_id and trait.active
              where score.book_id = b.id and score.confidence < 50
            )
          ) then 'incomplete_traits' end,
        case when editor.id is null then 'missing_editor' end,
        case when b.status = 'published' and not exists (
          select 1 from book_relationships relation
          join books target on target.id = relation.target_book_id
          where relation.source_book_id = b.id
            and relation.type in ('similar_theme', 'similar_style', 'similar_pace', 'similar_world')
            and relation.active
            and relation.approved_by is not null
            and relation.approved_at is not null
            and nullif(btrim(relation.public_reason), '') is not null
            and target.status = 'published'
            and target.deleted_at is null
        ) then 'no_similar_relations' end,
        case when b.status = 'published' and not exists (
          select 1 from book_offers offer
          join book_editions edition on edition.id = offer.edition_id
          join retailers partner on partner.id = offer.retailer_id
          where edition.book_id = b.id
            and edition.active and edition.deleted_at is null
            and offer.active and offer.deleted_at is null
            and partner.active and partner.deleted_at is null
        ) then 'no_retailer_offer' end,
        case when b.status = 'published' and exists (
          select 1 from book_offers offer
          join book_editions edition on edition.id = offer.edition_id
          join retailers partner on partner.id = offer.retailer_id
          where edition.book_id = b.id
            and edition.active and edition.deleted_at is null
            and offer.active and offer.deleted_at is null
            and partner.active and partner.deleted_at is null
            and (offer.checked_at is null or offer.checked_at < ${staleBeforeIso}::timestamptz)
        ) then 'stale_offer' end,
        case when b.status = 'needs_review'
          or latest_review.status = 'needs_review'
          or (b.status = 'published' and (latest_review.id is null or latest_review.status <> 'published'))
          then 'page_needs_review' end
      ]::text[], null)::text[] as issues
    from books b
    join authors a on a.id = b.primary_author_id
    left join lateral (
      select review.* from editorial_reviews review
      where review.book_id = b.id and review.deleted_at is null
      order by review.updated_at desc
      limit 1
    ) latest_review on true
    left join editors editor
      on editor.id = latest_review.editor_id and editor.deleted_at is null
    where b.deleted_at is null and b.status <> 'archived'
    order by b.updated_at desc, b.title asc
  `);

  const typedRows = rows as unknown as BookReadinessDbRow[];
  return typedRows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    author: String(row.author_name),
    status: String(row.status),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(String(row.updated_at)),
    issues: row.issues.filter((issue): issue is ReadinessIssueKind =>
      readinessIssueKinds.includes(issue as ReadinessIssueKind),
    ),
  }));
}

async function getDailyCalendarReadiness(db: Database) {
  const start = getEditorialDate();
  const end = addIsoDays(start, 27);
  const rows = await db
    .select({ date: dailyFeatures.featureDate, status: dailyFeatures.status })
    .from(dailyFeatures)
    .where(and(
      gte(dailyFeatures.featureDate, start),
      lte(dailyFeatures.featureDate, end),
      isNull(dailyFeatures.deletedAt),
    ))
    .orderBy(asc(dailyFeatures.featureDate));
  const byDate = new Map(rows.map((row) => [row.date, row.status]));
  const gaps: Array<{ date: string; existingStatus: string | null }> = [];
  for (let index = 0; index < 28; index += 1) {
    const date = addIsoDays(start, index);
    const status = byDate.get(date) ?? null;
    if (status !== "scheduled" && status !== "published") {
      gaps.push({ date, existingStatus: status });
    }
  }
  return { start, end, days: 28, readyDays: 28 - gaps.length, gaps };
}

async function getSeoHubReadiness(db: Database) {
  const [lists, taxonomies] = await Promise.all([
    getAdminEditorialLists(db),
    getAdminTaxonomies(db),
  ]);
  const requestedLists = lists.filter((item) => item.indexable);
  const requestedTaxonomies = taxonomies.filter((item) => item.indexable);

  const [listChecks, taxonomyChecks] = await Promise.all([
    Promise.all(requestedLists.map(async (item) => {
      const page = await getPublicEditorialListPage(
        item.slug,
        item.type === "length_hub" ? "length" : "list",
        db,
      );
      return {
        id: item.id,
        name: item.title,
        kind: "listă" as const,
        status: item.status,
        bookCount: Number(item.bookCount),
        adminHref: `/admin/lists/${item.id}`,
        passed: Boolean(page?.quality.indexable),
        missing: page
          ? page.quality.checks.filter((check) => !check.passed).map((check) => check.label)
          : ["Pagina nu poate fi hidratată public cu statusul și editorul curent"],
      };
    })),
    Promise.all(requestedTaxonomies.map(async (item) => {
      const kind = item.kind === "genre"
        ? "gen"
        : item.kind === "theme"
          ? "tema"
          : item.kind === "mood"
            ? "stare"
            : "pentru";
      const page = await getPublicTaxonomyHub(kind, item.slug, db);
      return {
        id: item.id,
        name: item.name,
        kind: "taxonomie" as const,
        status: item.status,
        bookCount: Number(item.bookCount),
        adminHref: `/admin/taxonomies/${item.kind}/${item.id}`,
        passed: Boolean(page?.quality.indexable),
        missing: page
          ? page.quality.checks.filter((check) => !check.passed).map((check) => check.label)
          : ["Pagina nu poate fi hidratată public cu statusul și editorul curent"],
      };
    })),
  ]);
  const checks = [...listChecks, ...taxonomyChecks];
  return {
    requested: checks.length,
    ready: checks.filter((item) => item.passed).length,
    belowGate: checks.filter((item) => !item.passed),
  };
}

export async function getLaunchReadinessReport(db: Database = getDb()) {
  const minimumBooks = getServerEnv().SEO_HUB_MINIMUM_BOOKS;
  const [bookRows, calendar, seo, authorTotals, nextReadTotals] = await Promise.all([
    getBookReadinessRows(db),
    getDailyCalendarReadiness(db),
    getSeoHubReadiness(db),
    db.select({ total: sql<number>`count(*)::int` }).from(authors)
      .where(and(sql`${authors.status} = 'published'`, isNull(authors.deletedAt))),
    db.execute(sql<{ total: number }>`
      select count(*)::int as total from (
        select relation.source_book_id
        from book_relationships relation
        join books source on source.id = relation.source_book_id
        join books target on target.id = relation.target_book_id
        where relation.type = 'next_read'
          and relation.active
          and relation.approved_by is not null
          and relation.approved_at is not null
          and nullif(btrim(relation.public_reason), '') is not null
          and source.status = 'published' and source.deleted_at is null
          and target.status = 'published' and target.deleted_at is null
        group by relation.source_book_id
        having count(*) >= ${minimumBooks}
      ) ready_next_read_pages
    `),
  ]);

  const publishedBooks = bookRows.filter((book) => book.status === "published");
  const editorialBlockers = new Set<ReadinessIssueKind>([
    "missing_caveat",
    "incomplete_traits",
    "missing_editor",
    "no_similar_relations",
    "page_needs_review",
  ]);
  const strongBooks = publishedBooks.filter(
    (book) => !book.issues.some((issue) => editorialBlockers.has(issue)),
  ).length;
  const issueCounts = Object.fromEntries(
    readinessIssueKinds.map((issue) => [
      issue,
      issue === "daily_calendar_gap"
        ? calendar.gaps.length
        : issue === "seo_hub_below_gate"
          ? seo.belowGate.length
          : bookRows.filter((book) => book.issues.includes(issue)).length,
    ]),
  ) as Record<ReadinessIssueKind, number>;

  return {
    generatedAt: new Date(),
    staleOfferDays: 30,
    books: bookRows,
    issueCounts,
    calendar,
    seo,
    targets: {
      strongBooks,
      publishedBooks: publishedBooks.length,
      publishedAuthors: Number(authorTotals[0]?.total ?? 0),
      readySeoHubs: seo.ready,
      readyNextReadPages: Number(nextReadTotals[0]?.total ?? 0),
      scheduledDailyFeatures: calendar.readyDays,
      trustPagesImplemented: 7,
    },
  };
}
