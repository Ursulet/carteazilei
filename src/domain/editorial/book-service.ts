import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { ensureEditorForUser } from "@/db/queries/admin-editorial";
import {
  authors,
  bookAudiences,
  bookEditions,
  bookGenres,
  bookMoods,
  books,
  bookThemes,
  bookTraitScores,
  editorialReviews,
  mediaAssets,
  seoMetadata,
} from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/service";

import { EditorialServiceError } from "./action-state";
import type { BookInput } from "./book-input";
import { evaluateBookPublishingGate, missingPublishingLabels } from "./publishing-gate";

function postgresCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : undefined;
}

async function assertBookReferences(input: BookInput) {
  const db = getDb();
  const [author] = await db.select({ id: authors.id }).from(authors)
    .where(and(eq(authors.id, input.authorId), isNull(authors.deletedAt))).limit(1);
  if (!author) throw new EditorialServiceError("Autorul selectat nu mai este disponibil.", { authorId: ["Alege un autor activ."] });

  if (!input.edition.coverAssetId) return null;
  const [cover] = await db.select({ id: mediaAssets.id, altText: mediaAssets.altText }).from(mediaAssets)
    .where(and(eq(mediaAssets.id, input.edition.coverAssetId), isNull(mediaAssets.deletedAt))).limit(1);
  if (!cover) throw new EditorialServiceError("Coperta selectată nu mai este disponibilă.", { coverAssetId: ["Alege o copertă activă."] });
  return cover;
}

export async function saveBook(input: BookInput, actorUserId: string, bookId?: string) {
  const db = getDb();
  const [cover, editor] = await Promise.all([
    assertBookReferences(input),
    ensureEditorForUser(db, actorUserId),
  ]);

  if (input.status === "published") {
    const gate = evaluateBookPublishingGate({
      title: input.title,
      slug: input.slug,
      authorId: input.authorId,
      activeEdition: input.edition.active,
      coverAlt: cover?.altText,
      verdict: input.verdict,
      summary: input.summary,
      caveats: input.caveats,
      genreIds: input.genreIds,
      editorialConfidence: input.editorialConfidence,
      editorId: editor.id,
    });
    const missing = missingPublishingLabels(gate);
    if (missing.length) {
      throw new EditorialServiceError(
        "Cartea nu poate fi publicată încă. Completează elementele din checklist.",
        undefined,
        gate,
      );
    }
  }

  try {
    return await db.transaction(async (transaction) => {
      const now = new Date();
      const existing = bookId
        ? (await transaction.select({ status: books.status }).from(books)
            .where(and(eq(books.id, bookId), isNull(books.deletedAt))).limit(1))[0]
        : null;
      if (bookId && !existing) throw new EditorialServiceError("Cartea nu mai există.");

      const bookValues = {
        title: input.title,
        slug: input.slug,
        originalTitle: input.originalTitle ?? null,
        primaryAuthorId: input.authorId,
        shortVerdict: input.verdict ?? null,
        spoilerFreeSummary: input.summary ?? null,
        status: input.status,
        editorialConfidence: input.editorialConfidence,
        publishedAt: input.status === "published" ? now : null,
        archivedAt: input.status === "archived" ? now : null,
      };

      const [savedBook] = bookId
        ? await transaction.update(books).set(bookValues).where(eq(books.id, bookId)).returning({ id: books.id })
        : await transaction.insert(books).values(bookValues).returning({ id: books.id });
      if (!savedBook) throw new EditorialServiceError("Cartea nu a putut fi salvată.");

      const [existingEdition] = await transaction.select({ id: bookEditions.id }).from(bookEditions)
        .where(and(eq(bookEditions.bookId, savedBook.id), isNull(bookEditions.deletedAt)))
        .orderBy(desc(bookEditions.active), desc(bookEditions.updatedAt)).limit(1);
      const editionValues = {
        bookId: savedBook.id,
        isbn10: input.edition.isbn10 ?? null,
        isbn13: input.edition.isbn13 ?? null,
        publisher: input.edition.publisher ?? null,
        publicationYear: input.edition.publicationYear ?? null,
        language: input.edition.language,
        pageCount: input.edition.pageCount ?? null,
        coverAssetId: input.edition.coverAssetId ?? null,
        editionLabel: input.edition.label ?? null,
        active: input.edition.active,
      };
      if (existingEdition) {
        await transaction.update(bookEditions).set(editionValues).where(eq(bookEditions.id, existingEdition.id));
      } else {
        await transaction.insert(bookEditions).values(editionValues);
      }

      const [existingReview] = await transaction.select({ id: editorialReviews.id }).from(editorialReviews)
        .where(and(eq(editorialReviews.bookId, savedBook.id), isNull(editorialReviews.deletedAt)))
        .orderBy(desc(editorialReviews.updatedAt)).limit(1);
      const reviewStatus = input.status === "published"
        ? "published" as const
        : input.status === "archived"
          ? "archived" as const
          : input.status === "needs_review" || input.status === "ready"
            ? "needs_review" as const
            : "draft" as const;
      const reviewValues = {
        bookId: savedBook.id,
        editorId: editor.id,
        verdict: input.verdict ?? null,
        strengths: input.strengths,
        caveats: input.caveats,
        status: reviewStatus,
        reviewedAt: reviewStatus === "needs_review" || reviewStatus === "published" ? now : null,
        publishedAt: reviewStatus === "published" ? now : null,
      };
      if (existingReview) {
        await transaction.update(editorialReviews).set(reviewValues).where(eq(editorialReviews.id, existingReview.id));
      } else {
        await transaction.insert(editorialReviews).values(reviewValues);
      }

      await Promise.all([
        transaction.delete(bookGenres).where(eq(bookGenres.bookId, savedBook.id)),
        transaction.delete(bookThemes).where(eq(bookThemes.bookId, savedBook.id)),
        transaction.delete(bookMoods).where(eq(bookMoods.bookId, savedBook.id)),
        transaction.delete(bookAudiences).where(eq(bookAudiences.bookId, savedBook.id)),
        transaction.delete(bookTraitScores).where(eq(bookTraitScores.bookId, savedBook.id)),
      ]);

      if (input.genreIds.length) await transaction.insert(bookGenres).values(input.genreIds.map((genreId, index) => ({ bookId: savedBook.id, genreId, isPrimary: index === 0 })));
      if (input.themeIds.length) await transaction.insert(bookThemes).values(input.themeIds.map((themeId) => ({ bookId: savedBook.id, themeId })));
      if (input.moodIds.length) await transaction.insert(bookMoods).values(input.moodIds.map((moodId) => ({ bookId: savedBook.id, moodId, strength: 50 })));
      if (input.audienceIds.length) await transaction.insert(bookAudiences).values(input.audienceIds.map((audienceId) => ({ bookId: savedBook.id, audienceId })));
      if (input.traitScores.length) await transaction.insert(bookTraitScores).values(input.traitScores.map((trait) => ({ ...trait, bookId: savedBook.id, updatedBy: editor.id })));

      await transaction.insert(seoMetadata).values({
        entityType: "book",
        entityId: savedBook.id,
        titleOverride: input.seo.title ?? null,
        descriptionOverride: input.seo.description ?? null,
        canonicalOverride: input.seo.canonical ?? null,
        indexable: input.seo.indexable,
        lastReviewedAt: now,
      }).onConflictDoUpdate({
        target: [seoMetadata.entityType, seoMetadata.entityId],
        set: {
          titleOverride: input.seo.title ?? null,
          descriptionOverride: input.seo.description ?? null,
          canonicalOverride: input.seo.canonical ?? null,
          indexable: input.seo.indexable,
          lastReviewedAt: now,
          updatedAt: now,
        },
      });

      const action = !existing
        ? "book.create"
        : existing.status !== "published" && input.status === "published"
          ? "book.publish"
          : existing.status === "published" && input.status !== "published"
            ? "book.unpublish"
            : "book.edit";
      await writeAuditLog({
        actorUserId,
        action,
        entityType: "book",
        entityId: savedBook.id,
        diff: { previousStatus: existing?.status ?? null, status: input.status, title: input.title },
      }, transaction);
      return savedBook.id;
    });
  } catch (error) {
    if (error instanceof EditorialServiceError) throw error;
    if (postgresCode(error) === "23505") {
      throw new EditorialServiceError("Slugul sau ISBN-ul este deja folosit.");
    }
    throw error;
  }
}

export async function deleteBook(bookId: string, actorUserId: string) {
  const db = getDb();
  await db.transaction(async (transaction) => {
    const [book] = await transaction.select({ title: books.title, status: books.status }).from(books)
      .where(and(eq(books.id, bookId), isNull(books.deletedAt))).limit(1);
    if (!book) throw new EditorialServiceError("Cartea nu mai există.");
    const now = new Date();
    await transaction.update(books).set({ status: "archived", archivedAt: now, deletedAt: now }).where(eq(books.id, bookId));
    await writeAuditLog({ actorUserId, action: "book.delete", entityType: "book", entityId: bookId, diff: { title: book.title, previousStatus: book.status } }, transaction);
  });
}
