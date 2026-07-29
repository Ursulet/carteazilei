import { sql } from "drizzle-orm";
import {
  boolean,
  check,
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

import { books } from "./catalog";
import {
  dailyFeatureStatusValues,
  editorialListStatusValues,
  editorialReviewStatusValues,
  nextReadBasisValues,
  relationshipProvenanceValues,
  relationshipTypeValues,
  softDelete,
  timestamps,
  uuidPrimaryKey,
} from "./common";
import { editors } from "./identity";
import { bookOffers } from "./retail";

export const editorialReviews = pgTable(
  "editorial_reviews",
  {
    id: uuidPrimaryKey(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    editorId: uuid("editor_id")
      .notNull()
      .references(() => editors.id, { onDelete: "restrict" }),
    verdict: text("verdict"),
    whyRead: text("why_read"),
    whyNot: text("why_not"),
    strengths: text("strengths").array().default(sql`'{}'::text[]`).notNull(),
    caveats: text("caveats").array().default(sql`'{}'::text[]`).notNull(),
    status: text("status", { enum: editorialReviewStatusValues })
      .default("draft")
      .notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    check(
      "editorial_reviews_status_valid",
      sql`${table.status} in ('draft', 'needs_review', 'published', 'archived')`,
    ),
    index("editorial_reviews_book_status_idx").on(table.bookId, table.status),
    index("editorial_reviews_editor_id_idx").on(table.editorId),
  ],
);

export const dailyFeatures = pgTable(
  "daily_features",
  {
    id: uuidPrimaryKey(),
    featureDate: date("feature_date").notNull().unique(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "restrict" }),
    editorId: uuid("editor_id")
      .notNull()
      .references(() => editors.id, { onDelete: "restrict" }),
    primaryOfferId: uuid("primary_offer_id").references(() => bookOffers.id, {
      onDelete: "set null",
    }),
    headline: text("headline"),
    whyToday: text("why_today"),
    audienceNote: text("audience_note"),
    fitPoints: text("fit_points").array().default(sql`'{}'::text[]`).notNull(),
    caveat: text("caveat"),
    status: text("status", { enum: dailyFeatureStatusValues }).default("draft").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    check(
      "daily_features_status_valid",
      sql`${table.status} in ('draft', 'scheduled', 'published', 'archived')`,
    ),
    index("daily_features_status_date_idx").on(table.status, table.featureDate),
    index("daily_features_book_id_idx").on(table.bookId),
    index("daily_features_primary_offer_id_idx").on(table.primaryOfferId),
  ],
);

export const bookRelationships = pgTable(
  "book_relationships",
  {
    id: uuidPrimaryKey(),
    sourceBookId: uuid("source_book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    targetBookId: uuid("target_book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    type: text("type", { enum: relationshipTypeValues }).notNull(),
    nextReadBasis: text("next_read_basis", { enum: nextReadBasisValues }),
    strength: integer("strength").notNull(),
    publicReason: text("public_reason"),
    provenance: text("provenance", { enum: relationshipProvenanceValues }).notNull(),
    approvedBy: uuid("approved_by").references(() => editors.id, {
      onDelete: "restrict",
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    active: boolean("active").default(false).notNull(),
    ...timestamps(),
  },
  (table) => [
    unique("book_relationships_source_target_type_unique").on(
      table.sourceBookId,
      table.targetBookId,
      table.type,
    ),
    check(
      "book_relationships_not_self",
      sql`${table.sourceBookId} <> ${table.targetBookId}`,
    ),
    check(
      "book_relationships_type_valid",
      sql`${table.type} in ('similar_theme', 'similar_style', 'similar_pace', 'similar_world', 'next_read', 'contrast_read')`,
    ),
    check(
      "book_relationships_provenance_valid",
      sql`${table.provenance} in ('editorial', 'algorithmic')`,
    ),
    check(
      "book_relationships_next_read_basis_valid",
      sql`${table.nextReadBasis} is null or (${table.type} = 'next_read' and ${table.nextReadBasis} in ('theme', 'pace', 'style', 'world', 'emotional_effect'))`,
    ),
    check(
      "book_relationships_strength_range",
      sql`${table.strength} between 0 and 100`,
    ),
    check(
      "book_relationships_active_approval",
      sql`not ${table.active} or (${table.approvedBy} is not null and ${table.approvedAt} is not null and nullif(btrim(${table.publicReason}), '') is not null)`,
    ),
    index("book_relationships_source_active_idx").on(table.sourceBookId, table.active),
    index("book_relationships_target_active_idx").on(table.targetBookId, table.active),
  ],
);

export const editorialLists = pgTable(
  "editorial_lists",
  {
    id: uuidPrimaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    intro: text("intro"),
    methodology: text("methodology"),
    editorId: uuid("editor_id")
      .notNull()
      .references(() => editors.id, { onDelete: "restrict" }),
    type: text("type").notNull(),
    minimumPageCount: integer("minimum_page_count"),
    maximumPageCount: integer("maximum_page_count"),
    indexable: boolean("indexable").default(false).notNull(),
    status: text("status", { enum: editorialListStatusValues }).default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    check(
      "editorial_lists_type_valid",
      sql`${table.type} in ('list', 'hub', 'guide', 'length_hub', 'next_read', 'similar_books')`,
    ),
    check(
      "editorial_lists_page_range_valid",
      sql`(${table.type} = 'length_hub' and (${table.minimumPageCount} is not null or ${table.maximumPageCount} is not null) and coalesce(${table.minimumPageCount}, 0) >= 0 and (${table.maximumPageCount} is null or ${table.maximumPageCount} >= coalesce(${table.minimumPageCount}, 0))) or (${table.type} <> 'length_hub' and ${table.minimumPageCount} is null and ${table.maximumPageCount} is null)`,
    ),
    check(
      "editorial_lists_status_valid",
      sql`${table.status} in ('draft', 'review', 'published', 'archived')`,
    ),
    index("editorial_lists_status_type_idx").on(table.status, table.type),
    index("editorial_lists_editor_id_idx").on(table.editorId),
  ],
);

export const editorialListBooks = pgTable(
  "editorial_list_books",
  {
    listId: uuid("list_id")
      .notNull()
      .references(() => editorialLists.id, { onDelete: "cascade" }),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    rank: integer("rank"),
    segment: text("segment"),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.listId, table.bookId] }),
    unique("editorial_list_books_list_position_unique").on(
      table.listId,
      table.position,
    ),
    check("editorial_list_books_position_positive", sql`${table.position} > 0`),
    check(
      "editorial_list_books_rank_positive",
      sql`${table.rank} is null or ${table.rank} > 0`,
    ),
    index("editorial_list_books_book_id_idx").on(table.bookId),
  ],
);
