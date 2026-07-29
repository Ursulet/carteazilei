import "server-only";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  audiences,
  authors,
  bookAudiences,
  bookEditions,
  bookGenres,
  bookMoods,
  bookOffers,
  bookThemes,
  bookTraitScores,
  books,
  dailyFeatures,
  editorialReviews,
  editors,
  genres,
  mediaAssets,
  moods,
  readingTraits,
  seoMetadata,
  themes,
  users,
  retailers,
} from "@/db/schema";
import { evaluateBookPublishingGate } from "@/domain/editorial/publishing-gate";

export async function ensureEditorForUser(db: Database, userId: string) {
  const [existing] = await db
    .select({ id: editors.id, displayName: editors.displayName })
    .from(editors)
    .where(and(eq(editors.userId, userId), isNull(editors.deletedAt)))
    .limit(1);
  if (existing) return existing;

  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);
  if (!user) throw new Error("Utilizatorul editorial nu mai există.");

  const base = (user.email.split("@")[0] || "editor")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "editor";

  const [created] = await db
    .insert(editors)
    .values({
      userId,
      displayName: user.name,
      slug: `${base}-${userId.slice(0, 8)}`,
      publicProfile: false,
    })
    .returning({ id: editors.id, displayName: editors.displayName });
  if (!created) throw new Error("Profilul editorului nu a putut fi creat.");
  return created;
}

export async function getBookFormOptions(db: Database = getDb()) {
  const [authorRows, genreRows, themeRows, moodRows, audienceRows, traitRows, mediaRows] =
    await Promise.all([
      db.select({ id: authors.id, name: authors.name }).from(authors)
        .where(and(isNull(authors.deletedAt), sql`${authors.status} <> 'archived'`)).orderBy(asc(authors.name)),
      db.select({ id: genres.id, name: genres.name }).from(genres)
        .where(and(isNull(genres.deletedAt), sql`${genres.status} <> 'archived'`)).orderBy(asc(genres.name)),
      db.select({ id: themes.id, name: themes.name }).from(themes)
        .where(and(isNull(themes.deletedAt), sql`${themes.status} <> 'archived'`)).orderBy(asc(themes.name)),
      db.select({ id: moods.id, name: moods.name }).from(moods)
        .where(and(isNull(moods.deletedAt), sql`${moods.status} <> 'archived'`)).orderBy(asc(moods.name)),
      db.select({ id: audiences.id, name: audiences.name }).from(audiences)
        .where(and(isNull(audiences.deletedAt), sql`${audiences.status} <> 'archived'`)).orderBy(asc(audiences.name)),
      db.select({ id: readingTraits.id, code: readingTraits.code, name: readingTraits.name }).from(readingTraits)
        .where(eq(readingTraits.active, true)).orderBy(asc(readingTraits.name)),
      db.select({ id: mediaAssets.id, altText: mediaAssets.altText, storageKey: mediaAssets.storageKey }).from(mediaAssets)
        .where(isNull(mediaAssets.deletedAt)).orderBy(desc(mediaAssets.createdAt)),
    ]);
  return { authors: authorRows, genres: genreRows, themes: themeRows, moods: moodRows, audiences: audienceRows, traits: traitRows, media: mediaRows };
}

export async function getBookPublishingSnapshot(db: Database, bookId: string) {
  const [row] = await db
    .select({
      title: books.title,
      slug: books.slug,
      authorId: books.primaryAuthorId,
      summary: books.spoilerFreeSummary,
      editorialConfidence: books.editorialConfidence,
      activeEdition: sql<boolean>`exists(select 1 from book_editions e where e.book_id = ${books.id} and e.active and e.deleted_at is null)`,
      coverAlt: sql<string | null>`(select m.alt_text from book_editions e join media_assets m on m.id = e.cover_asset_id and m.deleted_at is null where e.book_id = ${books.id} and e.active and e.deleted_at is null order by e.updated_at desc limit 1)`,
      verdict: sql<string | null>`(select r.verdict from editorial_reviews r where r.book_id = ${books.id} and r.deleted_at is null order by r.updated_at desc limit 1)`,
      caveats: sql<string[]>`coalesce((select r.caveats from editorial_reviews r where r.book_id = ${books.id} and r.deleted_at is null order by r.updated_at desc limit 1), '{}'::text[])`,
      editorId: sql<string | null>`(select r.editor_id from editorial_reviews r where r.book_id = ${books.id} and r.deleted_at is null order by r.updated_at desc limit 1)`,
      genreIds: sql<string[]>`coalesce((select array_agg(bg.genre_id::text) from book_genres bg where bg.book_id = ${books.id}), '{}'::text[])`,
    })
    .from(books)
    .where(and(eq(books.id, bookId), isNull(books.deletedAt)))
    .limit(1);
  return row;
}

export async function getAdminBooks(db: Database = getDb()) {
  const rows = await db
    .select({
      id: books.id,
      title: books.title,
      author: authors.name,
      status: books.status,
      confidence: books.editorialConfidence,
      updatedAt: books.updatedAt,
    })
    .from(books)
    .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
    .where(isNull(books.deletedAt))
    .orderBy(desc(books.updatedAt));

  return Promise.all(rows.map(async (row) => {
    const snapshot = await getBookPublishingSnapshot(db, row.id);
    const gate = snapshot ? evaluateBookPublishingGate(snapshot) : [];
    return { ...row, missingFields: gate.filter((item) => !item.passed).map((item) => item.label) };
  }));
}

export async function getAdminBook(bookId: string, db: Database = getDb()) {
  const [book] = await db.select().from(books)
    .where(and(eq(books.id, bookId), isNull(books.deletedAt))).limit(1);
  if (!book) return null;

  const [editionRows, reviewRows, seoRows, genreRows, themeRows, moodRows, audienceRows, traitRows, snapshot] = await Promise.all([
    db.select().from(bookEditions).where(and(eq(bookEditions.bookId, bookId), isNull(bookEditions.deletedAt))).orderBy(desc(bookEditions.active), desc(bookEditions.updatedAt)).limit(1),
    db.select().from(editorialReviews).where(and(eq(editorialReviews.bookId, bookId), isNull(editorialReviews.deletedAt))).orderBy(desc(editorialReviews.updatedAt)).limit(1),
    db.select().from(seoMetadata).where(and(eq(seoMetadata.entityType, "book"), eq(seoMetadata.entityId, bookId))).limit(1),
    db.select({ id: bookGenres.genreId }).from(bookGenres).where(eq(bookGenres.bookId, bookId)),
    db.select({ id: bookThemes.themeId }).from(bookThemes).where(eq(bookThemes.bookId, bookId)),
    db.select({ id: bookMoods.moodId }).from(bookMoods).where(eq(bookMoods.bookId, bookId)),
    db.select({ id: bookAudiences.audienceId }).from(bookAudiences).where(eq(bookAudiences.bookId, bookId)),
    db.select({ traitId: bookTraitScores.traitId, score: bookTraitScores.score, confidence: bookTraitScores.confidence }).from(bookTraitScores).where(eq(bookTraitScores.bookId, bookId)),
    getBookPublishingSnapshot(db, bookId),
  ]);
  return {
    book,
    edition: editionRows[0] ?? null,
    review: reviewRows[0] ?? null,
    seo: seoRows[0] ?? null,
    genreIds: genreRows.map((row) => row.id),
    themeIds: themeRows.map((row) => row.id),
    moodIds: moodRows.map((row) => row.id),
    audienceIds: audienceRows.map((row) => row.id),
    traitScores: traitRows,
    gate: snapshot ? evaluateBookPublishingGate(snapshot) : [],
  };
}

export async function getPublishedPreviewBook(bookId: string, db: Database = getDb()) {
  const record = await getAdminBook(bookId, db);
  if (!record) return null;
  const [author] = await db.select({ name: authors.name }).from(authors).where(eq(authors.id, record.book.primaryAuthorId)).limit(1);
  const cover = record.edition?.coverAssetId
    ? (await db.select({ altText: mediaAssets.altText, storageKey: mediaAssets.storageKey }).from(mediaAssets).where(eq(mediaAssets.id, record.edition.coverAssetId)).limit(1))[0]
    : null;
  return { ...record, author: author?.name ?? "Autor necunoscut", cover };
}

export async function getDailyFeatureOptions(db: Database = getDb()) {
  const [bookRows, editorRows, offerRows] = await Promise.all([
    db.select({ id: books.id, title: books.title, status: books.status }).from(books)
      .where(and(isNull(books.deletedAt), sql`${books.status} <> 'archived'`)).orderBy(asc(books.title)),
    db.select({ id: editors.id, displayName: editors.displayName }).from(editors)
      .where(isNull(editors.deletedAt)).orderBy(asc(editors.displayName)),
    db.select({
      id: bookOffers.id,
      bookId: bookEditions.bookId,
      bookTitle: books.title,
      partnerName: retailers.name,
      price: bookOffers.price,
      currency: bookOffers.currency,
      isPrimary: bookOffers.isPrimary,
    }).from(bookOffers)
      .innerJoin(bookEditions, eq(bookEditions.id, bookOffers.editionId))
      .innerJoin(books, eq(books.id, bookEditions.bookId))
      .innerJoin(retailers, eq(retailers.id, bookOffers.retailerId))
      .where(and(
        eq(bookOffers.active, true),
        isNull(bookOffers.deletedAt),
        eq(bookEditions.active, true),
        isNull(bookEditions.deletedAt),
        eq(retailers.active, true),
        isNull(retailers.deletedAt),
      ))
      .orderBy(asc(books.title), desc(bookOffers.isPrimary), asc(bookOffers.displayOrder), asc(retailers.name)),
  ]);
  return { books: bookRows, editors: editorRows, offers: offerRows };
}

export async function getAdminDailyFeatures(db: Database = getDb()) {
  return db.select({
    id: dailyFeatures.id,
    featureDate: dailyFeatures.featureDate,
    headline: dailyFeatures.headline,
    status: dailyFeatures.status,
    bookTitle: books.title,
    editorName: editors.displayName,
    updatedAt: dailyFeatures.updatedAt,
  }).from(dailyFeatures)
    .innerJoin(books, eq(books.id, dailyFeatures.bookId))
    .innerJoin(editors, eq(editors.id, dailyFeatures.editorId))
    .where(isNull(dailyFeatures.deletedAt))
    .orderBy(desc(dailyFeatures.featureDate));
}

export async function getAdminDailyFeature(id: string, db: Database = getDb()) {
  const [row] = await db.select().from(dailyFeatures)
    .where(and(eq(dailyFeatures.id, id), isNull(dailyFeatures.deletedAt))).limit(1);
  return row ?? null;
}
