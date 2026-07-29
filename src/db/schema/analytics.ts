import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { books } from "./catalog";
import {
  acquisitionChannelValues,
  productEventNameValues,
  uuidPrimaryKey,
} from "./common";
import { dailyFeatures } from "./editorial";
import { recommendationResults, recommendationSessions } from "./recommendation";
import { bookOffers } from "./retail";

export const productEvents = pgTable(
  "product_events",
  {
    id: uuidPrimaryKey(),
    eventName: text("event_name", { enum: productEventNameValues }).notNull(),
    anonymousSessionId: text("anonymous_session_id"),
    recommendationSessionId: uuid("recommendation_session_id").references(
      () => recommendationSessions.id,
      { onDelete: "restrict" },
    ),
    recommendationResultId: uuid("recommendation_result_id").references(
      () => recommendationResults.id,
      { onDelete: "restrict" },
    ),
    bookId: uuid("book_id").references(() => books.id, { onDelete: "restrict" }),
    dailyFeatureId: uuid("daily_feature_id").references(() => dailyFeatures.id, {
      onDelete: "restrict",
    }),
    offerId: uuid("offer_id").references(() => bookOffers.id, { onDelete: "restrict" }),
    resultRank: integer("result_rank"),
    algorithmVersion: text("algorithm_version"),
    sourcePath: text("source_path"),
    acquisitionChannel: text("acquisition_channel", {
      enum: acquisitionChannelValues,
    }),
    referrerHost: text("referrer_host"),
    isLanding: boolean("is_landing").default(false).notNull(),
    dedupeKey: text("dedupe_key"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "product_events_name_valid",
      sql`${table.eventName} in ('page_viewed', 'recommendation_quiz_started', 'recommendation_quiz_completed', 'recommendation_result_shown', 'recommendation_alternative_requested', 'book_viewed', 'daily_feature_viewed', 'retailer_click', 'recommendation_feedback_positive', 'recommendation_feedback_negative', 'book_started', 'book_finished')`,
    ),
    check(
      "product_events_acquisition_channel_valid",
      sql`${table.acquisitionChannel} is null or ${table.acquisitionChannel} in ('direct', 'organic', 'referral', 'internal')`,
    ),
    check(
      "product_events_referrer_host_length",
      sql`${table.referrerHost} is null or length(${table.referrerHost}) <= 253`,
    ),
    check(
      "product_events_rank_valid",
      sql`${table.resultRank} is null or ${table.resultRank} between 1 and 3`,
    ),
    check(
      "product_events_reference_valid",
      sql`case
        when ${table.eventName} = 'page_viewed'
          then ${table.sourcePath} is not null and ${table.acquisitionChannel} is not null
        when ${table.eventName} in ('recommendation_quiz_started', 'recommendation_quiz_completed')
          then ${table.recommendationSessionId} is not null
        when ${table.eventName} in ('recommendation_result_shown', 'recommendation_alternative_requested', 'recommendation_feedback_positive', 'recommendation_feedback_negative', 'book_started', 'book_finished')
          then ${table.recommendationSessionId} is not null and ${table.recommendationResultId} is not null and ${table.bookId} is not null
        when ${table.eventName} = 'book_viewed'
          then ${table.bookId} is not null
        when ${table.eventName} = 'daily_feature_viewed'
          then ${table.dailyFeatureId} is not null and ${table.bookId} is not null
        when ${table.eventName} = 'retailer_click'
          then ${table.offerId} is not null and ${table.bookId} is not null
        else false
      end`,
    ),
    uniqueIndex("product_events_dedupe_key_unique")
      .on(table.dedupeKey)
      .where(sql`${table.dedupeKey} is not null`),
    index("product_events_name_occurred_idx").on(table.eventName, table.occurredAt),
    index("product_events_acquisition_occurred_idx").on(
      table.acquisitionChannel,
      table.occurredAt,
    ),
    index("product_events_path_occurred_idx").on(table.sourcePath, table.occurredAt),
    index("product_events_session_occurred_idx").on(
      table.recommendationSessionId,
      table.occurredAt,
    ),
    index("product_events_book_occurred_idx").on(table.bookId, table.occurredAt),
    index("product_events_offer_occurred_idx").on(table.offerId, table.occurredAt),
  ],
);
