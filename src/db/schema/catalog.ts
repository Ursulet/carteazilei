import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  authorStatusValues,
  bookStatusValues,
  softDelete,
  taxonomyStatusValues,
  timestamps,
  uuidPrimaryKey,
} from "./common";
import { editors } from "./identity";
import { mediaAssets } from "./media";

export const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const authors = pgTable(
  "authors",
  {
    id: uuidPrimaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    bio: text("bio"),
    portraitAssetId: uuid("portrait_asset_id").references(() => mediaAssets.id, {
      onDelete: "restrict",
    }),
    verifiedFacts: text("verified_facts"),
    sourceNotes: text("source_notes"),
    status: text("status", { enum: authorStatusValues }).default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    check(
      "authors_status_valid",
      sql`${table.status} in ('draft', 'needs_review', 'published', 'archived')`,
    ),
    index("authors_status_idx").on(table.status),
    index("authors_name_trgm_idx").using("gin", table.name.op("gin_trgm_ops")),
  ],
);

export const books = pgTable(
  "books",
  {
    id: uuidPrimaryKey(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    slug: text("slug").notNull().unique(),
    originalTitle: text("original_title"),
    primaryAuthorId: uuid("primary_author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "restrict" }),
    shortVerdict: text("short_verdict"),
    spoilerFreeSummary: text("spoiler_free_summary"),
    status: text("status", { enum: bookStatusValues }).default("draft").notNull(),
    editorialConfidence: integer("editorial_confidence").default(0).notNull(),
    searchText: text("search_text").default("").notNull(),
    searchDocument: tsvector("search_document")
      .default(sql`to_tsvector('simple', '')`)
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    check(
      "books_status_valid",
      sql`${table.status} in ('draft', 'needs_review', 'ready', 'published', 'archived')`,
    ),
    check(
      "books_editorial_confidence_range",
      sql`${table.editorialConfidence} between 0 and 100`,
    ),
    index("books_primary_author_id_idx").on(table.primaryAuthorId),
    index("books_status_idx").on(table.status),
    index("books_title_trgm_idx").using("gin", table.title.op("gin_trgm_ops")),
    index("books_search_text_trgm_idx").using(
      "gin",
      table.searchText.op("gin_trgm_ops"),
    ),
    index("books_search_document_idx").using("gin", table.searchDocument),
  ],
);

export const bookEditions = pgTable(
  "book_editions",
  {
    id: uuidPrimaryKey(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    isbn10: text("isbn10").unique(),
    isbn13: text("isbn13").unique(),
    publisher: text("publisher"),
    publicationYear: integer("publication_year"),
    publicationDate: date("publication_date"),
    language: text("language").default("ro").notNull(),
    pageCount: integer("page_count"),
    coverAssetId: uuid("cover_asset_id").references(() => mediaAssets.id, {
      onDelete: "restrict",
    }),
    editionLabel: text("edition_label"),
    active: boolean("active").default(true).notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    check(
      "book_editions_isbn10_format",
      sql`${table.isbn10} is null or ${table.isbn10} ~ '^[0-9X]{10}$'`,
    ),
    check(
      "book_editions_isbn13_format",
      sql`${table.isbn13} is null or ${table.isbn13} ~ '^[0-9]{13}$'`,
    ),
    check(
      "book_editions_publication_year_range",
      sql`${table.publicationYear} is null or ${table.publicationYear} between 1450 and 3000`,
    ),
    check(
      "book_editions_page_count_positive",
      sql`${table.pageCount} is null or ${table.pageCount} > 0`,
    ),
    index("book_editions_book_id_idx").on(table.bookId),
    index("book_editions_active_idx").on(table.active),
  ],
);

export const genres = pgTable(
  "genres",
  {
    id: uuidPrimaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    searchIntent: text("search_intent"),
    editorialIntro: text("editorial_intro"),
    methodology: text("methodology"),
    editorId: uuid("editor_id").references(() => editors.id, {
      onDelete: "set null",
    }),
    indexable: boolean("indexable").default(false).notNull(),
    status: text("status", { enum: taxonomyStatusValues }).default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    check(
      "genres_status_valid",
      sql`${table.status} in ('draft', 'published', 'archived')`,
    ),
    index("genres_status_indexable_idx").on(table.status, table.indexable),
    index("genres_editor_id_idx").on(table.editorId),
  ],
);

export const themes = pgTable(
  "themes",
  {
    id: uuidPrimaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    searchIntent: text("search_intent"),
    editorialIntro: text("editorial_intro"),
    methodology: text("methodology"),
    editorId: uuid("editor_id").references(() => editors.id, {
      onDelete: "set null",
    }),
    indexable: boolean("indexable").default(false).notNull(),
    status: text("status", { enum: taxonomyStatusValues }).default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    check(
      "themes_status_valid",
      sql`${table.status} in ('draft', 'published', 'archived')`,
    ),
    index("themes_status_indexable_idx").on(table.status, table.indexable),
    index("themes_editor_id_idx").on(table.editorId),
  ],
);

export const moods = pgTable(
  "moods",
  {
    id: uuidPrimaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    searchIntent: text("search_intent"),
    editorialIntro: text("editorial_intro"),
    methodology: text("methodology"),
    editorId: uuid("editor_id").references(() => editors.id, {
      onDelete: "set null",
    }),
    indexable: boolean("indexable").default(false).notNull(),
    status: text("status", { enum: taxonomyStatusValues }).default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    check(
      "moods_status_valid",
      sql`${table.status} in ('draft', 'published', 'archived')`,
    ),
    index("moods_status_indexable_idx").on(table.status, table.indexable),
    index("moods_editor_id_idx").on(table.editorId),
  ],
);

export const audiences = pgTable(
  "audiences",
  {
    id: uuidPrimaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    searchIntent: text("search_intent"),
    editorialIntro: text("editorial_intro"),
    methodology: text("methodology"),
    editorId: uuid("editor_id").references(() => editors.id, {
      onDelete: "set null",
    }),
    indexable: boolean("indexable").default(false).notNull(),
    status: text("status", { enum: taxonomyStatusValues }).default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    minimumAge: integer("minimum_age"),
    maximumAge: integer("maximum_age"),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    check(
      "audiences_status_valid",
      sql`${table.status} in ('draft', 'published', 'archived')`,
    ),
    check(
      "audiences_age_range_valid",
      sql`(${table.minimumAge} is null or ${table.minimumAge} >= 0) and (${table.maximumAge} is null or ${table.maximumAge} >= coalesce(${table.minimumAge}, 0))`,
    ),
    index("audiences_status_indexable_idx").on(table.status, table.indexable),
    index("audiences_editor_id_idx").on(table.editorId),
  ],
);

export const readingTraits = pgTable(
  "reading_traits",
  {
    id: uuidPrimaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    active: boolean("active").default(true).notNull(),
    ...timestamps(),
  },
  (table) => [index("reading_traits_active_idx").on(table.active)],
);

export const bookGenres = pgTable(
  "book_genres",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "restrict" }),
    isPrimary: boolean("is_primary").default(false).notNull(),
    hubPosition: integer("hub_position"),
    hubReason: text("hub_reason"),
  },
  (table) => [
    primaryKey({ columns: [table.bookId, table.genreId] }),
    check(
      "book_genres_hub_position_positive",
      sql`${table.hubPosition} is null or ${table.hubPosition} > 0`,
    ),
    index("book_genres_genre_id_idx").on(table.genreId),
  ],
);

export const bookThemes = pgTable(
  "book_themes",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    themeId: uuid("theme_id")
      .notNull()
      .references(() => themes.id, { onDelete: "restrict" }),
    hubPosition: integer("hub_position"),
    hubReason: text("hub_reason"),
  },
  (table) => [
    primaryKey({ columns: [table.bookId, table.themeId] }),
    check(
      "book_themes_hub_position_positive",
      sql`${table.hubPosition} is null or ${table.hubPosition} > 0`,
    ),
    index("book_themes_theme_id_idx").on(table.themeId),
  ],
);

export const bookMoods = pgTable(
  "book_moods",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    moodId: uuid("mood_id")
      .notNull()
      .references(() => moods.id, { onDelete: "restrict" }),
    strength: integer("strength").default(50).notNull(),
    hubPosition: integer("hub_position"),
    hubReason: text("hub_reason"),
  },
  (table) => [
    primaryKey({ columns: [table.bookId, table.moodId] }),
    check("book_moods_strength_range", sql`${table.strength} between 0 and 100`),
    check(
      "book_moods_hub_position_positive",
      sql`${table.hubPosition} is null or ${table.hubPosition} > 0`,
    ),
    index("book_moods_mood_id_idx").on(table.moodId),
  ],
);

export const bookAudiences = pgTable(
  "book_audiences",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    audienceId: uuid("audience_id")
      .notNull()
      .references(() => audiences.id, { onDelete: "restrict" }),
    hubPosition: integer("hub_position"),
    hubReason: text("hub_reason"),
  },
  (table) => [
    primaryKey({ columns: [table.bookId, table.audienceId] }),
    check(
      "book_audiences_hub_position_positive",
      sql`${table.hubPosition} is null or ${table.hubPosition} > 0`,
    ),
    index("book_audiences_audience_id_idx").on(table.audienceId),
  ],
);

export const bookTraitScores = pgTable(
  "book_trait_scores",
  {
    id: uuidPrimaryKey(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    traitId: uuid("trait_id")
      .notNull()
      .references(() => readingTraits.id, { onDelete: "restrict" }),
    score: integer("score").notNull(),
    confidence: integer("confidence").default(0).notNull(),
    editorNote: text("editor_note"),
    updatedBy: uuid("updated_by").references(() => editors.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (table) => [
    unique("book_trait_scores_book_trait_unique").on(table.bookId, table.traitId),
    check("book_trait_scores_score_range", sql`${table.score} between 0 and 100`),
    check(
      "book_trait_scores_confidence_range",
      sql`${table.confidence} between 0 and 100`,
    ),
    index("book_trait_scores_trait_id_idx").on(table.traitId),
  ],
);
