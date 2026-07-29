import { sql } from "drizzle-orm";
import { boolean, check, index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { books } from "./catalog";
import { timestamps, uuidPrimaryKey } from "./common";

export const legacyImportSourceTypeValues = [
  "author",
  "book",
  "media",
  "review",
  "daily_feature",
] as const;

export const legacyImportOutcomeValues = ["imported", "linked", "quarantined"] as const;

/** Stable source-to-target identity makes an apply run safe to repeat. */
export const legacyImportRecords = pgTable(
  "legacy_import_records",
  {
    id: uuidPrimaryKey(),
    sourceSystem: text("source_system").notNull(),
    sourceType: text("source_type", { enum: legacyImportSourceTypeValues }).notNull(),
    legacyId: text("legacy_id").notNull(),
    sourceUrl: text("source_url"),
    contentHash: text("content_hash").notNull(),
    targetEntityType: text("target_entity_type").notNull(),
    targetEntityId: uuid("target_entity_id"),
    outcome: text("outcome", { enum: legacyImportOutcomeValues }).notNull(),
    importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps(),
  },
  (table) => [
    unique("legacy_import_records_source_unique").on(table.sourceSystem, table.sourceType, table.legacyId),
    check("legacy_import_records_source_system_present", sql`length(btrim(${table.sourceSystem})) > 0`),
    check("legacy_import_records_legacy_id_present", sql`length(btrim(${table.legacyId})) > 0`),
    check("legacy_import_records_hash_sha256", sql`${table.contentHash} ~ '^[a-f0-9]{64}$'`),
    check("legacy_import_records_source_type_valid", sql`${table.sourceType} in ('author', 'book', 'media', 'review', 'daily_feature')`),
    check("legacy_import_records_outcome_valid", sql`${table.outcome} in ('imported', 'linked', 'quarantined')`),
    index("legacy_import_records_target_idx").on(table.targetEntityType, table.targetEntityId),
    index("legacy_import_records_imported_at_idx").on(table.importedAt),
  ],
);

/** Legacy reviews cannot become public editorial reviews without an explicit later workflow. */
export const legacyReviewQuarantine = pgTable(
  "legacy_review_quarantine",
  {
    id: uuidPrimaryKey(),
    importRecordId: uuid("import_record_id")
      .notNull()
      .references(() => legacyImportRecords.id, { onDelete: "restrict" }),
    bookId: uuid("book_id").references(() => books.id, { onDelete: "set null" }),
    legacyBookReference: text("legacy_book_reference"),
    reviewerName: text("reviewer_name"),
    sourceLabel: text("source_label"),
    sourceUrl: text("source_url"),
    body: text("body").notNull(),
    originVerified: boolean("origin_verified").default(false).notNull(),
    verificationNote: text("verification_note"),
    quarantineReason: text("quarantine_reason").notNull(),
    status: text("status").default("quarantined").notNull(),
    ...timestamps(),
  },
  (table) => [
    unique("legacy_review_quarantine_import_record_unique").on(table.importRecordId),
    check("legacy_review_quarantine_body_present", sql`length(btrim(${table.body})) > 0`),
    check("legacy_review_quarantine_reason_present", sql`length(btrim(${table.quarantineReason})) > 0`),
    check("legacy_review_quarantine_status_valid", sql`${table.status} in ('quarantined', 'verified', 'rejected')`),
    index("legacy_review_quarantine_status_idx").on(table.status),
    index("legacy_review_quarantine_book_id_idx").on(table.bookId),
  ],
);
