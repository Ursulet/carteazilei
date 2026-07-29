import "server-only";

import { and, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { ensureEditorForUser } from "@/db/queries/admin-editorial";
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
import { publicBookPageEligibility } from "@/db/queries/public-book-pages";
import { getServerEnv } from "@/lib/env/server";
import { writeAuditLog } from "@/lib/audit/service";

import { EditorialServiceError, type PublishingGateItem } from "./action-state";
import type { BookRelationshipInput, EditorialListInput, TaxonomyHubInput } from "./seo-hub-input";

function postgresCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? String(error.code) : undefined;
}

async function uniqueSeoMetadata(
  entityType: "editorial_list" | "genre" | "theme" | "mood" | "audience",
  entityId: string | undefined,
  title: string | undefined,
  description: string | undefined,
) {
  if (!title || !description) return false;
  const db = getDb();
  const identityCondition = entityId
    ? or(ne(seoMetadata.entityType, entityType), ne(seoMetadata.entityId, entityId))
    : sql`true`;
  const [duplicate] = await db.select({ id: seoMetadata.id }).from(seoMetadata).where(and(
    eq(seoMetadata.indexable, true),
    identityCondition,
    or(
      sql`lower(btrim(${seoMetadata.titleOverride})) = lower(btrim(${title}))`,
      sql`lower(btrim(${seoMetadata.descriptionOverride})) = lower(btrim(${description}))`,
    ),
  )).limit(1);
  return !duplicate;
}

async function eligibleBookIds(bookIds: string[]) {
  if (!bookIds.length) return new Map<string, number | null>();
  const db = getDb();
  const rows = await db.select({
    id: books.id,
    pageCount: sql<number | null>`(select e.page_count from book_editions e where e.book_id = ${books.id} and e.active and e.deleted_at is null order by e.updated_at desc limit 1)`,
  }).from(books)
    .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .where(and(inArray(books.id, bookIds), eq(books.status, "published"), isNull(books.deletedAt), eq(authors.status, "published"), isNull(authors.deletedAt), publicBookPageEligibility));
  return new Map(rows.map((row) => [row.id, row.pageCount]));
}

function qualityGate({
  statusPublished,
  intro,
  methodology,
  seoTitle,
  seoDescription,
  uniqueSeo,
  eligibleCount,
}: {
  statusPublished: boolean;
  intro?: string;
  methodology?: string;
  seoTitle?: string;
  seoDescription?: string;
  uniqueSeo: boolean;
  eligibleCount: number;
}): PublishingGateItem[] {
  const minimum = getServerEnv().SEO_HUB_MINIMUM_BOOKS;
  return [
    { key: "status", label: "Status publicat", passed: statusPublished },
    { key: "books", label: `Minimum ${minimum} cărți publice cu motiv`, passed: eligibleCount >= minimum },
    { key: "intro", label: "Introducere editorială", passed: Boolean(intro?.trim()) },
    { key: "methodology", label: "Metodologie / context de selecție", passed: Boolean(methodology?.trim()) },
    { key: "seo_title", label: "Titlu SEO", passed: Boolean(seoTitle?.trim()) },
    { key: "seo_description", label: "Descriere SEO", passed: Boolean(seoDescription?.trim()) },
    { key: "seo_unique", label: "Metadata SEO unică", passed: uniqueSeo },
  ];
}

function assertIndexingGate(indexable: boolean, gate: PublishingGateItem[]) {
  if (indexable && gate.some((item) => !item.passed)) {
    throw new EditorialServiceError(
      "Indexarea nu poate fi activată până când toate criteriile sunt îndeplinite. Poți salva pagina cu indexarea dezactivată.",
      undefined,
      gate,
    );
  }
}

export async function saveEditorialList(input: EditorialListInput, actorUserId: string, listId?: string) {
  const db = getDb();
  const [editor, eligibleIds, uniqueSeo] = await Promise.all([
    ensureEditorForUser(db, actorUserId),
    eligibleBookIds(input.selections.map((selection) => selection.bookId)),
    uniqueSeoMetadata("editorial_list", listId, input.seoTitle, input.seoDescription),
  ]);
  const gate = qualityGate({
    statusPublished: input.status === "published",
    intro: input.intro,
    methodology: input.methodology,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    uniqueSeo,
    eligibleCount: input.selections.filter((selection) => {
      if (!eligibleIds.has(selection.bookId)) return false;
      if (input.type !== "length_hub") return true;
      const pages = eligibleIds.get(selection.bookId);
      return pages !== null && pages !== undefined &&
        (input.minimumPageCount === undefined || pages >= input.minimumPageCount) &&
        (input.maximumPageCount === undefined || pages <= input.maximumPageCount);
    }).length,
  });
  assertIndexingGate(input.indexable, gate);

  try {
    return await db.transaction(async (transaction) => {
      const [existing] = listId ? await transaction.select({ id: editorialLists.id, publishedAt: editorialLists.publishedAt }).from(editorialLists).where(and(eq(editorialLists.id, listId), isNull(editorialLists.deletedAt))).limit(1) : [];
      if (listId && !existing) throw new EditorialServiceError("Lista nu mai există.");
      const now = new Date();
      const values = {
        title: input.title,
        slug: input.slug,
        intro: input.intro ?? null,
        methodology: input.methodology ?? null,
        editorId: editor.id,
        type: input.type,
        minimumPageCount: input.type === "length_hub" ? input.minimumPageCount ?? null : null,
        maximumPageCount: input.type === "length_hub" ? input.maximumPageCount ?? null : null,
        indexable: input.indexable,
        status: input.status,
        publishedAt: input.status === "published" ? existing?.publishedAt ?? now : null,
      };
      const [saved] = existing
        ? await transaction.update(editorialLists).set(values).where(eq(editorialLists.id, existing.id)).returning({ id: editorialLists.id })
        : await transaction.insert(editorialLists).values(values).returning({ id: editorialLists.id });
      if (!saved) throw new EditorialServiceError("Lista nu a putut fi salvată.");
      await transaction.delete(editorialListBooks).where(eq(editorialListBooks.listId, saved.id));
      if (input.selections.length) await transaction.insert(editorialListBooks).values(input.selections.map((selection) => ({
        listId: saved.id,
        bookId: selection.bookId,
        position: selection.position,
        rank: null,
        segment: selection.segment ?? null,
        reason: selection.reason,
      })));
      await transaction.insert(seoMetadata).values({ entityType: "editorial_list", entityId: saved.id, titleOverride: input.seoTitle ?? null, descriptionOverride: input.seoDescription ?? null, canonicalOverride: null, indexable: input.indexable, lastReviewedAt: now })
        .onConflictDoUpdate({ target: [seoMetadata.entityType, seoMetadata.entityId], set: { titleOverride: input.seoTitle ?? null, descriptionOverride: input.seoDescription ?? null, canonicalOverride: null, indexable: input.indexable, lastReviewedAt: now, updatedAt: now } });
      await writeAuditLog({ actorUserId, action: existing ? "editorial_list.edit" : "editorial_list.create", entityType: "editorial_list", entityId: saved.id, diff: { title: input.title, status: input.status, indexable: input.indexable, type: input.type, selectionCount: input.selections.length } }, transaction);
      return saved.id;
    });
  } catch (error) {
    if (error instanceof EditorialServiceError) throw error;
    if (postgresCode(error) === "23505") throw new EditorialServiceError("Slugul sau pozițiile selecțiilor sunt deja folosite.");
    throw error;
  }
}

export async function deleteEditorialList(listId: string, actorUserId: string) {
  const db = getDb();
  await db.transaction(async (transaction) => {
    const [existing] = await transaction.select({ id: editorialLists.id }).from(editorialLists).where(and(eq(editorialLists.id, listId), isNull(editorialLists.deletedAt))).limit(1);
    if (!existing) throw new EditorialServiceError("Lista nu mai există.");
    await transaction.update(editorialLists).set({ status: "archived", indexable: false, deletedAt: new Date() }).where(eq(editorialLists.id, listId));
    await transaction.update(seoMetadata).set({ indexable: false }).where(and(eq(seoMetadata.entityType, "editorial_list"), eq(seoMetadata.entityId, listId)));
    await writeAuditLog({ actorUserId, action: "editorial_list.delete", entityType: "editorial_list", entityId: listId }, transaction);
  });
}

export async function saveTaxonomyHub(input: TaxonomyHubInput, actorUserId: string, taxonomyId?: string) {
  const db = getDb();
  const [editor, eligibleIds, uniqueSeo] = await Promise.all([
    ensureEditorForUser(db, actorUserId),
    eligibleBookIds(input.selections.map((selection) => selection.bookId)),
    uniqueSeoMetadata(input.kind, taxonomyId, input.seoTitle, input.seoDescription),
  ]);
  const gate = qualityGate({ statusPublished: input.status === "published", intro: input.editorialIntro, methodology: input.methodology, seoTitle: input.seoTitle, seoDescription: input.seoDescription, uniqueSeo, eligibleCount: input.selections.filter((selection) => eligibleIds.has(selection.bookId) && Boolean(selection.reason?.trim())).length });
  assertIndexingGate(input.indexable, gate);

  try {
    return await db.transaction(async (transaction) => {
      const now = new Date();
      let savedId: string | undefined;
      let previousPublishedAt: Date | null = null;
      if (taxonomyId) {
        if (input.kind === "genre") previousPublishedAt = (await transaction.select({ value: genres.publishedAt }).from(genres).where(eq(genres.id, taxonomyId)).limit(1))[0]?.value ?? null;
        else if (input.kind === "theme") previousPublishedAt = (await transaction.select({ value: themes.publishedAt }).from(themes).where(eq(themes.id, taxonomyId)).limit(1))[0]?.value ?? null;
        else if (input.kind === "mood") previousPublishedAt = (await transaction.select({ value: moods.publishedAt }).from(moods).where(eq(moods.id, taxonomyId)).limit(1))[0]?.value ?? null;
        else previousPublishedAt = (await transaction.select({ value: audiences.publishedAt }).from(audiences).where(eq(audiences.id, taxonomyId)).limit(1))[0]?.value ?? null;
      }
      const commonValues = { name: input.name, slug: input.slug, description: input.description ?? null, searchIntent: input.searchIntent ?? null, editorialIntro: input.editorialIntro ?? null, methodology: input.methodology ?? null, editorId: editor.id, indexable: input.indexable, status: input.status, publishedAt: input.status === "published" ? previousPublishedAt ?? now : null };
      if (input.kind === "genre") {
        const existingSelections = taxonomyId ? await transaction.select({ bookId: bookGenres.bookId, isPrimary: bookGenres.isPrimary }).from(bookGenres).where(eq(bookGenres.genreId, taxonomyId)) : [];
        const primaryByBook = new Map(existingSelections.map((item) => [item.bookId, item.isPrimary]));
        const [saved] = taxonomyId ? await transaction.update(genres).set(commonValues).where(and(eq(genres.id, taxonomyId), isNull(genres.deletedAt))).returning({ id: genres.id }) : await transaction.insert(genres).values(commonValues).returning({ id: genres.id });
        savedId = saved?.id;
        if (savedId) { await transaction.delete(bookGenres).where(eq(bookGenres.genreId, savedId)); if (input.selections.length) await transaction.insert(bookGenres).values(input.selections.map((item) => ({ bookId: item.bookId, genreId: savedId!, isPrimary: primaryByBook.get(item.bookId) ?? false, hubPosition: item.position, hubReason: item.reason ?? null }))); }
      } else if (input.kind === "theme") {
        const [saved] = taxonomyId ? await transaction.update(themes).set(commonValues).where(and(eq(themes.id, taxonomyId), isNull(themes.deletedAt))).returning({ id: themes.id }) : await transaction.insert(themes).values(commonValues).returning({ id: themes.id });
        savedId = saved?.id;
        if (savedId) { await transaction.delete(bookThemes).where(eq(bookThemes.themeId, savedId)); if (input.selections.length) await transaction.insert(bookThemes).values(input.selections.map((item) => ({ bookId: item.bookId, themeId: savedId!, hubPosition: item.position, hubReason: item.reason ?? null }))); }
      } else if (input.kind === "mood") {
        const [saved] = taxonomyId ? await transaction.update(moods).set(commonValues).where(and(eq(moods.id, taxonomyId), isNull(moods.deletedAt))).returning({ id: moods.id }) : await transaction.insert(moods).values(commonValues).returning({ id: moods.id });
        savedId = saved?.id;
        if (savedId) { await transaction.delete(bookMoods).where(eq(bookMoods.moodId, savedId)); if (input.selections.length) await transaction.insert(bookMoods).values(input.selections.map((item) => ({ bookId: item.bookId, moodId: savedId!, strength: item.strength ?? 50, hubPosition: item.position, hubReason: item.reason ?? null }))); }
      } else {
        const audienceValues = { ...commonValues, minimumAge: input.minimumAge ?? null, maximumAge: input.maximumAge ?? null };
        const [saved] = taxonomyId ? await transaction.update(audiences).set(audienceValues).where(and(eq(audiences.id, taxonomyId), isNull(audiences.deletedAt))).returning({ id: audiences.id }) : await transaction.insert(audiences).values(audienceValues).returning({ id: audiences.id });
        savedId = saved?.id;
        if (savedId) { await transaction.delete(bookAudiences).where(eq(bookAudiences.audienceId, savedId)); if (input.selections.length) await transaction.insert(bookAudiences).values(input.selections.map((item) => ({ bookId: item.bookId, audienceId: savedId!, hubPosition: item.position, hubReason: item.reason ?? null }))); }
      }
      if (!savedId) throw new EditorialServiceError("Taxonomia nu a putut fi salvată.");
      await transaction.insert(seoMetadata).values({ entityType: input.kind, entityId: savedId, titleOverride: input.seoTitle ?? null, descriptionOverride: input.seoDescription ?? null, canonicalOverride: null, indexable: input.indexable, lastReviewedAt: now })
        .onConflictDoUpdate({ target: [seoMetadata.entityType, seoMetadata.entityId], set: { titleOverride: input.seoTitle ?? null, descriptionOverride: input.seoDescription ?? null, canonicalOverride: null, indexable: input.indexable, lastReviewedAt: now, updatedAt: now } });
      await writeAuditLog({ actorUserId, action: taxonomyId ? "taxonomy.edit" : "taxonomy.create", entityType: input.kind, entityId: savedId, diff: { name: input.name, status: input.status, indexable: input.indexable, selectionCount: input.selections.length } }, transaction);
      return savedId;
    });
  } catch (error) {
    if (error instanceof EditorialServiceError) throw error;
    if (postgresCode(error) === "23505") throw new EditorialServiceError("Slugul este deja folosit sau cartea apare de două ori.");
    throw error;
  }
}

export async function saveBookRelationship(input: BookRelationshipInput, actorUserId: string, relationshipId?: string) {
  const db = getDb();
  const editor = await ensureEditorForUser(db, actorUserId);
  const found = await db.select({ id: books.id }).from(books).where(and(inArray(books.id, [input.sourceBookId, input.targetBookId]), isNull(books.deletedAt)));
  if (found.length !== 2) throw new EditorialServiceError("Una dintre cărți nu mai este disponibilă.");
  try {
    return await db.transaction(async (transaction) => {
      const values = {
        sourceBookId: input.sourceBookId,
        targetBookId: input.targetBookId,
        type: input.type,
        nextReadBasis: input.type === "next_read" ? input.nextReadBasis ?? null : null,
        strength: input.strength,
        publicReason: input.publicReason ?? null,
        provenance: input.provenance,
        active: input.active,
        approvedBy: input.active ? editor.id : null,
        approvedAt: input.active ? new Date() : null,
      };
      const [saved] = relationshipId
        ? await transaction.update(bookRelationships).set(values).where(eq(bookRelationships.id, relationshipId)).returning({ id: bookRelationships.id })
        : await transaction.insert(bookRelationships).values(values).returning({ id: bookRelationships.id });
      if (!saved) throw new EditorialServiceError("Relația nu a putut fi salvată.");
      await writeAuditLog({ actorUserId, action: relationshipId ? "book_relationship.edit" : "book_relationship.create", entityType: "book_relationship", entityId: saved.id, diff: { sourceBookId: input.sourceBookId, targetBookId: input.targetBookId, type: input.type, nextReadBasis: input.nextReadBasis ?? null, active: input.active } }, transaction);
      return saved.id;
    });
  } catch (error) {
    if (error instanceof EditorialServiceError) throw error;
    if (postgresCode(error) === "23505") throw new EditorialServiceError("Această relație există deja între cele două cărți.");
    throw error;
  }
}
