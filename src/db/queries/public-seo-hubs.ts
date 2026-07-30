import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  audiences,
  authors,
  bookAudiences,
  bookGenres,
  bookMoods,
  bookRelationships,
  bookThemes,
  books,
  editorialListBooks,
  editorialLists,
  editors,
  genres,
  moods,
  seoMetadata,
  themes,
} from "@/db/schema";
import { getServerEnv } from "@/lib/env/server";

import {
  bookCardSelection,
  getBookRelations,
  getPublicBookPage,
  publicBookPageEligibility,
  publishedBookConditions,
  type PublicBookCard,
} from "./public-book-pages";

export const taxonomyHubKinds = ["gen", "tema", "stare", "pentru"] as const;
export type TaxonomyHubKind = (typeof taxonomyHubKinds)[number];
export type RelationshipLandingMode = "similar" | "next_read";

const taxonomyEntityTypes = {
  gen: "genre",
  tema: "theme",
  stare: "mood",
  pentru: "audience",
} as const;

const taxonomyLabels = {
  gen: "Gen",
  tema: "Temă",
  stare: "Stare de lectură",
  pentru: "Pentru cine",
} as const;

type HubSeo = {
  title: string | null;
  description: string | null;
  canonical: string | null;
  indexable: boolean | null;
  lastReviewedAt: Date | null;
};

type HubEditor = { id: string; name: string; slug: string; publicProfile: boolean };

type TaxonomyEntity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  searchIntent: string | null;
  editorialIntro: string | null;
  methodology: string | null;
  indexable: boolean;
  status: string;
  publishedAt: Date | null;
  updatedAt: Date;
  editor: HubEditor;
  seo: HubSeo;
};

type HubSelection = PublicBookCard & {
  reason: string;
  position: number | null;
  pageCount?: number | null;
};

const emptyHubSeo: HubSeo = {
  title: null,
  description: null,
  canonical: null,
  indexable: null,
  lastReviewedAt: null,
};

function nonEmpty(value: string | null | undefined) {
  return Boolean(value?.trim());
}

/** Verifică dacă titlul și descrierea SEO nu dublează o altă entitate indexabilă. */
async function hasUniqueSeoMetadata(
  entityType: string,
  entityId: string,
  seo: HubSeo,
  db: Database,
) {
  if (!nonEmpty(seo.title) || !nonEmpty(seo.description)) return false;
  const [duplicate] = await db
    .select({ id: seoMetadata.id })
    .from(seoMetadata)
    .where(
      and(
        eq(seoMetadata.indexable, true),
        or(ne(seoMetadata.entityType, entityType as typeof seoMetadata.entityType.enumValues[number]), ne(seoMetadata.entityId, entityId)),
        or(
          sql`lower(btrim(${seoMetadata.titleOverride})) = lower(btrim(${seo.title!}))`,
          sql`lower(btrim(${seoMetadata.descriptionOverride})) = lower(btrim(${seo.description!}))`,
        ),
      ),
    )
    .limit(1);
  return !duplicate;
}

/** Evaluează quality gate-ul comun fără a transforma pragul într-un generator SEO. */
function evaluateHubQuality({
  publicStatus,
  requestedIndexing,
  intro,
  methodology,
  editorId,
  seo,
  uniqueSeo,
  selectionCount,
}: {
  publicStatus: boolean;
  requestedIndexing: boolean;
  intro: string | null;
  methodology: string | null;
  editorId: string | null;
  seo: HubSeo;
  uniqueSeo: boolean;
  selectionCount: number;
}) {
  const minimumBooks = getServerEnv().SEO_HUB_MINIMUM_BOOKS;
  const checks = [
    { key: "status", label: "Status public", passed: publicStatus },
    { key: "books", label: `Minimum ${minimumBooks} cărți eligibile și explicate`, passed: selectionCount >= minimumBooks },
    { key: "intro", label: "Introducere editorială", passed: nonEmpty(intro) },
    { key: "methodology", label: "Metodologie / context de selecție", passed: nonEmpty(methodology) },
    { key: "editor", label: "Editor atribuit", passed: Boolean(editorId) },
    { key: "seo", label: "Titlu și descriere SEO unice", passed: Boolean(seo.indexable) && uniqueSeo },
  ];
  return {
    minimumBooks,
    checks,
    indexable: requestedIndexing && checks.every((check) => check.passed),
  };
}

/** Încarcă o taxonomie publicată și normalizează cele patru modele într-un contract comun. */
async function loadTaxonomyEntity(
  kind: TaxonomyHubKind,
  slug: string,
  db: Database,
): Promise<TaxonomyEntity | null> {
  const selection = {
    id: genres.id,
    name: genres.name,
    slug: genres.slug,
    description: genres.description,
    searchIntent: genres.searchIntent,
    editorialIntro: genres.editorialIntro,
    methodology: genres.methodology,
    indexable: genres.indexable,
    status: genres.status,
    publishedAt: genres.publishedAt,
    updatedAt: genres.updatedAt,
    editor: {
      id: editors.id,
      name: editors.displayName,
      slug: editors.slug,
      publicProfile: editors.publicProfile,
    },
    seo: {
      title: seoMetadata.titleOverride,
      description: seoMetadata.descriptionOverride,
      canonical: seoMetadata.canonicalOverride,
      indexable: seoMetadata.indexable,
      lastReviewedAt: seoMetadata.lastReviewedAt,
    },
  };

  if (kind === "gen") {
    const [row] = await db.select(selection).from(genres)
      .innerJoin(editors, and(eq(editors.id, genres.editorId), isNull(editors.deletedAt)))
      .leftJoin(seoMetadata, and(eq(seoMetadata.entityType, "genre"), eq(seoMetadata.entityId, genres.id)))
      .where(and(eq(genres.slug, slug), eq(genres.status, "published"), isNull(genres.deletedAt))).limit(1);
    return row ? { ...row, seo: row.seo ?? emptyHubSeo } : null;
  }

  const table = kind === "tema" ? themes : kind === "stare" ? moods : audiences;
  const entityType = taxonomyEntityTypes[kind];
  const [row] = await db
    .select({
      id: table.id,
      name: table.name,
      slug: table.slug,
      description: table.description,
      searchIntent: table.searchIntent,
      editorialIntro: table.editorialIntro,
      methodology: table.methodology,
      indexable: table.indexable,
      status: table.status,
      publishedAt: table.publishedAt,
      updatedAt: table.updatedAt,
      editor: { id: editors.id, name: editors.displayName, slug: editors.slug, publicProfile: editors.publicProfile },
      seo: {
        title: seoMetadata.titleOverride,
        description: seoMetadata.descriptionOverride,
        canonical: seoMetadata.canonicalOverride,
        indexable: seoMetadata.indexable,
        lastReviewedAt: seoMetadata.lastReviewedAt,
      },
    })
    .from(table)
    .innerJoin(editors, and(eq(editors.id, table.editorId), isNull(editors.deletedAt)))
    .leftJoin(seoMetadata, and(eq(seoMetadata.entityType, entityType), eq(seoMetadata.entityId, table.id)))
    .where(and(eq(table.slug, slug), eq(table.status, "published"), isNull(table.deletedAt)))
    .limit(1);
  return row ? { ...row, seo: row.seo ?? emptyHubSeo } : null;
}

/** Încarcă numai cărți publice care au un motiv specific hub-ului. */
async function loadTaxonomySelections(
  kind: TaxonomyHubKind,
  taxonomyId: string,
  db: Database,
): Promise<HubSelection[]> {
  const commonWhere = and(publishedBookConditions, publicBookPageEligibility);
  if (kind === "gen") {
    return db.select({ ...bookCardSelection(), reason: bookGenres.hubReason, position: bookGenres.hubPosition })
      .from(bookGenres).innerJoin(books, eq(books.id, bookGenres.bookId)).innerJoin(authors, eq(authors.id, books.primaryAuthorId))
      .where(and(eq(bookGenres.genreId, taxonomyId), commonWhere, sql`nullif(btrim(${bookGenres.hubReason}), '') is not null`))
      .orderBy(sql`${bookGenres.hubPosition} asc nulls last`, asc(books.title)) as Promise<HubSelection[]>;
  }
  if (kind === "tema") {
    return db.select({ ...bookCardSelection(), reason: bookThemes.hubReason, position: bookThemes.hubPosition })
      .from(bookThemes).innerJoin(books, eq(books.id, bookThemes.bookId)).innerJoin(authors, eq(authors.id, books.primaryAuthorId))
      .where(and(eq(bookThemes.themeId, taxonomyId), commonWhere, sql`nullif(btrim(${bookThemes.hubReason}), '') is not null`))
      .orderBy(sql`${bookThemes.hubPosition} asc nulls last`, asc(books.title)) as Promise<HubSelection[]>;
  }
  if (kind === "stare") {
    return db.select({ ...bookCardSelection(), reason: bookMoods.hubReason, position: bookMoods.hubPosition })
      .from(bookMoods).innerJoin(books, eq(books.id, bookMoods.bookId)).innerJoin(authors, eq(authors.id, books.primaryAuthorId))
      .where(and(eq(bookMoods.moodId, taxonomyId), commonWhere, sql`nullif(btrim(${bookMoods.hubReason}), '') is not null`))
      .orderBy(sql`${bookMoods.hubPosition} asc nulls last`, asc(books.title)) as Promise<HubSelection[]>;
  }
  return db.select({ ...bookCardSelection(), reason: bookAudiences.hubReason, position: bookAudiences.hubPosition })
    .from(bookAudiences).innerJoin(books, eq(books.id, bookAudiences.bookId)).innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .where(and(eq(bookAudiences.audienceId, taxonomyId), commonWhere, sql`nullif(btrim(${bookAudiences.hubReason}), '') is not null`))
    .orderBy(sql`${bookAudiences.hubPosition} asc nulls last`, asc(books.title)) as Promise<HubSelection[]>;
}

/** Încarcă un hub taxonomic public și calculează indexabilitatea din conținutul real. */
export async function getPublicTaxonomyHub(
  kind: TaxonomyHubKind,
  slug: string,
  db: Database = getDb(),
) {
  const entity = await loadTaxonomyEntity(kind, slug, db);
  if (!entity) return null;
  const [selections, uniqueSeo] = await Promise.all([
    loadTaxonomySelections(kind, entity.id, db),
    hasUniqueSeoMetadata(taxonomyEntityTypes[kind], entity.id, entity.seo, db),
  ]);
  const quality = evaluateHubQuality({
    publicStatus: entity.status === "published",
    requestedIndexing: entity.indexable,
    intro: entity.editorialIntro,
    methodology: entity.methodology,
    editorId: entity.editor.id,
    seo: entity.seo,
    uniqueSeo,
    selectionCount: selections.length,
  });
  return {
    kind,
    kindLabel: taxonomyLabels[kind],
    href: `/carti/${kind}/${entity.slug}`,
    entity,
    selections,
    quality,
  };
}

/** Încarcă o listă editorială sau un hub de lungime fără a combina URL-uri canonice. */
export async function getPublicEditorialListPage(
  slug: string,
  routeKind: "list" | "length",
  db: Database = getDb(),
) {
  const allowedTypes = routeKind === "length" ? ["length_hub"] : ["list", "guide", "hub"];
  const [list] = await db
    .select({
      id: editorialLists.id,
      title: editorialLists.title,
      slug: editorialLists.slug,
      intro: editorialLists.intro,
      methodology: editorialLists.methodology,
      type: editorialLists.type,
      minimumPageCount: editorialLists.minimumPageCount,
      maximumPageCount: editorialLists.maximumPageCount,
      indexable: editorialLists.indexable,
      status: editorialLists.status,
      publishedAt: editorialLists.publishedAt,
      updatedAt: editorialLists.updatedAt,
      editor: { id: editors.id, name: editors.displayName, slug: editors.slug, publicProfile: editors.publicProfile },
      seo: {
        title: seoMetadata.titleOverride,
        description: seoMetadata.descriptionOverride,
        canonical: seoMetadata.canonicalOverride,
        indexable: seoMetadata.indexable,
        lastReviewedAt: seoMetadata.lastReviewedAt,
      },
    })
    .from(editorialLists)
    .innerJoin(editors, and(eq(editors.id, editorialLists.editorId), isNull(editors.deletedAt)))
    .leftJoin(seoMetadata, and(eq(seoMetadata.entityType, "editorial_list"), eq(seoMetadata.entityId, editorialLists.id)))
    .where(and(eq(editorialLists.slug, slug), inArray(editorialLists.type, allowedTypes), eq(editorialLists.status, "published"), isNull(editorialLists.deletedAt)))
    .limit(1);
  if (!list) return null;
  const normalizedList = { ...list, seo: list.seo ?? emptyHubSeo };
  const outerBookId = sql.raw('"books"."id"');

  const rows = await db
    .select({
      ...bookCardSelection(),
      reason: editorialListBooks.reason,
      position: editorialListBooks.position,
      segment: editorialListBooks.segment,
      pageCount: sql<number | null>`(select e.page_count from book_editions e where e.book_id = ${outerBookId} and e.active and e.deleted_at is null order by e.updated_at desc limit 1)`,
    })
    .from(editorialListBooks)
    .innerJoin(books, eq(books.id, editorialListBooks.bookId))
    .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .where(and(eq(editorialListBooks.listId, list.id), publishedBookConditions, publicBookPageEligibility, sql`nullif(btrim(${editorialListBooks.reason}), '') is not null`))
    .orderBy(asc(editorialListBooks.position));

  const selections = rows.filter((row) => {
    if (routeKind !== "length" || row.pageCount === null) return routeKind !== "length";
    return (normalizedList.minimumPageCount === null || row.pageCount >= normalizedList.minimumPageCount) &&
      (normalizedList.maximumPageCount === null || row.pageCount <= normalizedList.maximumPageCount);
  });
  const uniqueSeo = await hasUniqueSeoMetadata("editorial_list", normalizedList.id, normalizedList.seo, db);
  const quality = evaluateHubQuality({
    publicStatus: normalizedList.status === "published",
    requestedIndexing: normalizedList.indexable,
    intro: normalizedList.intro,
    methodology: normalizedList.methodology,
    editorId: normalizedList.editor.id,
    seo: normalizedList.seo,
    uniqueSeo,
    selectionCount: selections.length,
  });
  return {
    routeKind,
    href: routeKind === "length" ? `/carti/lungime/${normalizedList.slug}` : `/liste/${normalizedList.slug}`,
    list: normalizedList,
    selections,
    quality,
  };
}

/** Construiește paginile distincte de similaritate și continuare din muchii editoriale disjuncte. */
export async function getPublicRelationshipLanding(
  slug: string,
  mode: RelationshipLandingMode,
  db: Database = getDb(),
) {
  const source = await getPublicBookPage(slug, db);
  if (!source) return null;
  const allRelationships = await getBookRelations(db, source.book.id, 100);
  const relationships = mode === "next_read"
    ? allRelationships.filter((relationship) => relationship.type === "next_read" && relationship.nextReadBasis)
    : allRelationships.filter((relationship) => relationship.type.startsWith("similar_"));
  const minimumBooks = getServerEnv().SEO_HUB_MINIMUM_BOOKS;
  const indexable = Boolean(source.seo?.indexable) && relationships.length >= minimumBooks;
  return {
    mode,
    source,
    relationships,
    quality: { minimumBooks, indexable },
    href: mode === "next_read"
      ? `/ce-sa-citesc-dupa/${source.book.slug}`
      : `/carti-asemanatoare-cu/${source.book.slug}`,
  };
}

/** Returnează numai listele care trec quality gate-ul și au canonical pe `/liste`. */
export async function listPublicEditorialLists(db: Database = getDb()) {
  const rows = await db.select({ slug: editorialLists.slug }).from(editorialLists)
    .where(and(inArray(editorialLists.type, ["list", "guide", "hub"]), eq(editorialLists.status, "published"), isNull(editorialLists.deletedAt)))
    .orderBy(desc(editorialLists.publishedAt), asc(editorialLists.title));
  const hydrated = await Promise.all(rows.map((row) => getPublicEditorialListPage(row.slug, "list", db)));
  return hydrated.filter((row): row is NonNullable<typeof row> => Boolean(row?.quality.indexable));
}

/** Găsește hub-uri care împart cărți reale cu selecția curentă și păstrează numai destinații indexabile. */
export async function listRelatedIndexableHubs(
  bookIds: string[],
  currentHref: string,
  db: Database = getDb(),
) {
  const ids = [...new Set(bookIds)].slice(0, 50);
  if (!ids.length) return [];
  const [genreRows, themeRows, moodRows, audienceRows, listRows] = await Promise.all([
    db.select({ slug: genres.slug, shared: sql<number>`count(*)::int` }).from(bookGenres)
      .innerJoin(genres, eq(genres.id, bookGenres.genreId))
      .where(and(inArray(bookGenres.bookId, ids), eq(genres.status, "published"), isNull(genres.deletedAt)))
      .groupBy(genres.id, genres.slug).orderBy(desc(sql`count(*)`)).limit(4),
    db.select({ slug: themes.slug, shared: sql<number>`count(*)::int` }).from(bookThemes)
      .innerJoin(themes, eq(themes.id, bookThemes.themeId))
      .where(and(inArray(bookThemes.bookId, ids), eq(themes.status, "published"), isNull(themes.deletedAt)))
      .groupBy(themes.id, themes.slug).orderBy(desc(sql`count(*)`)).limit(4),
    db.select({ slug: moods.slug, shared: sql<number>`count(*)::int` }).from(bookMoods)
      .innerJoin(moods, eq(moods.id, bookMoods.moodId))
      .where(and(inArray(bookMoods.bookId, ids), eq(moods.status, "published"), isNull(moods.deletedAt)))
      .groupBy(moods.id, moods.slug).orderBy(desc(sql`count(*)`)).limit(4),
    db.select({ slug: audiences.slug, shared: sql<number>`count(*)::int` }).from(bookAudiences)
      .innerJoin(audiences, eq(audiences.id, bookAudiences.audienceId))
      .where(and(inArray(bookAudiences.bookId, ids), eq(audiences.status, "published"), isNull(audiences.deletedAt)))
      .groupBy(audiences.id, audiences.slug).orderBy(desc(sql`count(*)`)).limit(4),
    db.select({ slug: editorialLists.slug, type: editorialLists.type, shared: sql<number>`count(*)::int` }).from(editorialListBooks)
      .innerJoin(editorialLists, eq(editorialLists.id, editorialListBooks.listId))
      .where(and(inArray(editorialListBooks.bookId, ids), eq(editorialLists.status, "published"), isNull(editorialLists.deletedAt), inArray(editorialLists.type, ["list", "guide", "hub", "length_hub"])))
      .groupBy(editorialLists.id, editorialLists.slug, editorialLists.type).orderBy(desc(sql`count(*)`)).limit(6),
  ]);
  const taxonomyCandidates = [
    ...genreRows.map((row) => ({ kind: "gen" as const, ...row })),
    ...themeRows.map((row) => ({ kind: "tema" as const, ...row })),
    ...moodRows.map((row) => ({ kind: "stare" as const, ...row })),
    ...audienceRows.map((row) => ({ kind: "pentru" as const, ...row })),
  ];
  const [taxonomyPages, listPages] = await Promise.all([
    Promise.all(taxonomyCandidates.map(async (candidate) => ({ candidate, page: await getPublicTaxonomyHub(candidate.kind, candidate.slug, db) }))),
    Promise.all(listRows.map(async (candidate) => ({ candidate, page: await getPublicEditorialListPage(candidate.slug, candidate.type === "length_hub" ? "length" : "list", db) }))),
  ]);
  return [
    ...taxonomyPages.flatMap(({ candidate, page }) => page?.quality.indexable ? [{ href: page.href, title: page.entity.name, eyebrow: page.kindLabel, shared: candidate.shared }] : []),
    ...listPages.flatMap(({ candidate, page }) => page?.quality.indexable ? [{ href: page.href, title: page.list.title, eyebrow: page.routeKind === "length" ? "Lungime" : "Listă editorială", shared: candidate.shared }] : []),
  ]
    .filter((item) => item.href !== currentHref)
    .sort((left, right) => right.shared - left.shared || left.title.localeCompare(right.title, "ro"))
    .filter((item, index, all) => all.findIndex((candidate) => candidate.href === item.href) === index)
    .slice(0, 6);
}

/** Produce toate intrările dinamice eligibile pentru sitemap, cu timestamp editorial real. */
export async function listIndexableSeoHubEntries(db: Database = getDb()) {
  const [genreRows, themeRows, moodRows, audienceRows, listRows, sourceRows] = await Promise.all([
    db.select({ slug: genres.slug }).from(genres).where(and(eq(genres.status, "published"), isNull(genres.deletedAt))),
    db.select({ slug: themes.slug }).from(themes).where(and(eq(themes.status, "published"), isNull(themes.deletedAt))),
    db.select({ slug: moods.slug }).from(moods).where(and(eq(moods.status, "published"), isNull(moods.deletedAt))),
    db.select({ slug: audiences.slug }).from(audiences).where(and(eq(audiences.status, "published"), isNull(audiences.deletedAt))),
    db.select({ slug: editorialLists.slug, type: editorialLists.type }).from(editorialLists).where(and(eq(editorialLists.status, "published"), isNull(editorialLists.deletedAt), inArray(editorialLists.type, ["list", "guide", "hub", "length_hub"]))),
    db.selectDistinct({ slug: books.slug }).from(bookRelationships).innerJoin(books, eq(books.id, bookRelationships.sourceBookId)).where(and(eq(bookRelationships.active, true), eq(books.status, "published"), isNull(books.deletedAt))),
  ]);
  const taxonomyRequests = [
    ...genreRows.map((row) => ["gen", row.slug] as const),
    ...themeRows.map((row) => ["tema", row.slug] as const),
    ...moodRows.map((row) => ["stare", row.slug] as const),
    ...audienceRows.map((row) => ["pentru", row.slug] as const),
  ];
  const [taxonomyPages, listPages, relationshipPages] = await Promise.all([
    Promise.all(taxonomyRequests.map(([kind, slug]) => getPublicTaxonomyHub(kind, slug, db))),
    Promise.all(listRows.map((row) => getPublicEditorialListPage(row.slug, row.type === "length_hub" ? "length" : "list", db))),
    Promise.all(sourceRows.flatMap((row) => [
      getPublicRelationshipLanding(row.slug, "similar", db),
      getPublicRelationshipLanding(row.slug, "next_read", db),
    ])),
  ]);
  return [
    ...taxonomyPages.flatMap((page) => page?.quality.indexable ? [{ href: page.href, lastModified: page.entity.updatedAt }] : []),
    ...listPages.flatMap((page) => page?.quality.indexable ? [{ href: page.href, lastModified: page.list.updatedAt }] : []),
    ...relationshipPages.flatMap((page) => page?.quality.indexable ? [{ href: page.href, lastModified: page.source.book.updatedAt }] : []),
  ];
}

export type PublicTaxonomyHub = NonNullable<Awaited<ReturnType<typeof getPublicTaxonomyHub>>>;
export type PublicEditorialListPage = NonNullable<Awaited<ReturnType<typeof getPublicEditorialListPage>>>;
export type PublicRelationshipLanding = NonNullable<Awaited<ReturnType<typeof getPublicRelationshipLanding>>>;
