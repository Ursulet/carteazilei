import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { books } from "./catalog";
import { commercialClickContextValues, uuidPrimaryKey } from "./common";
import { dailyFeatures } from "./editorial";
import { recommendationResults } from "./recommendation";
import { bookOffers, retailers } from "./retail";

export const commercialClickEvents = pgTable(
  "commercial_click_events",
  {
    id: uuidPrimaryKey(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "restrict" }),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => retailers.id, { onDelete: "restrict" }),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => bookOffers.id, { onDelete: "restrict" }),
    sourceContext: text("source_context", { enum: commercialClickContextValues })
      .notNull(),
    sourcePath: text("source_path").notNull(),
    dailyFeatureId: uuid("daily_feature_id").references(() => dailyFeatures.id, {
      onDelete: "set null",
    }),
    recommendationResultId: uuid("recommendation_result_id").references(
      () => recommendationResults.id,
      { onDelete: "set null" },
    ),
    clickedAt: timestamp("clicked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "commercial_click_events_context_valid",
      sql`${table.sourceContext} in ('book_page', 'daily_feature', 'recommendation', 'other')`,
    ),
    index("commercial_click_events_clicked_at_idx").on(table.clickedAt),
    index("commercial_click_events_book_clicked_idx").on(table.bookId, table.clickedAt),
    index("commercial_click_events_partner_clicked_idx").on(
      table.partnerId,
      table.clickedAt,
    ),
    index("commercial_click_events_offer_clicked_idx").on(table.offerId, table.clickedAt),
    index("commercial_click_events_context_clicked_idx").on(
      table.sourceContext,
      table.clickedAt,
    ),
  ],
);

export const commercialImpressionEvents = pgTable(
  "commercial_impression_events",
  {
    id: uuidPrimaryKey(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "restrict" }),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => retailers.id, { onDelete: "restrict" }),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => bookOffers.id, { onDelete: "restrict" }),
    sourceContext: text("source_context", { enum: commercialClickContextValues })
      .notNull(),
    sourcePath: text("source_path").notNull(),
    dailyFeatureId: uuid("daily_feature_id").references(() => dailyFeatures.id, {
      onDelete: "set null",
    }),
    recommendationResultId: uuid("recommendation_result_id").references(
      () => recommendationResults.id,
      { onDelete: "set null" },
    ),
    displayedAt: timestamp("displayed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "commercial_impression_events_context_valid",
      sql`${table.sourceContext} in ('book_page', 'daily_feature', 'recommendation', 'other')`,
    ),
    index("commercial_impression_events_displayed_at_idx").on(table.displayedAt),
    index("commercial_impression_events_book_displayed_idx").on(
      table.bookId,
      table.displayedAt,
    ),
    index("commercial_impression_events_partner_displayed_idx").on(
      table.partnerId,
      table.displayedAt,
    ),
    index("commercial_impression_events_offer_displayed_idx").on(
      table.offerId,
      table.displayedAt,
    ),
    index("commercial_impression_events_context_displayed_idx").on(
      table.sourceContext,
      table.displayedAt,
    ),
  ],
);
