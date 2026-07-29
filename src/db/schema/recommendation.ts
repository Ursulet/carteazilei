import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { books } from "./catalog";
import {
  recommendationBranchValues,
  recommendationFeedbackActionValues,
  recommendationSessionStatusValues,
  uuidPrimaryKey,
} from "./common";
import { users } from "./identity";

export type RecommendationAnswerValue =
  | string
  | string[]
  | number
  | boolean
  | null;

export type RecommendationAnswersSnapshot = {
  schemaVersion: number;
  steps: Record<string, RecommendationAnswerValue>;
};

export const recommendationSessions = pgTable(
  "recommendation_sessions",
  {
    id: uuidPrimaryKey(),
    opaqueToken: text("opaque_token").notNull().unique(),
    anonymousSessionId: text("anonymous_session_id").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    branch: text("branch", { enum: recommendationBranchValues }).notNull(),
    status: text("status", { enum: recommendationSessionStatusValues })
      .default("started")
      .notNull(),
    answersJson: jsonb("answers_json").$type<RecommendationAnswersSnapshot>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      "recommendation_sessions_branch_valid",
      sql`${table.branch} in ('self', 'gift', 'child')`,
    ),
    check(
      "recommendation_sessions_status_valid",
      sql`${table.status} in ('started', 'completed', 'expired')`,
    ),
    check(
      "recommendation_sessions_expiry_valid",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    index("recommendation_sessions_anonymous_id_idx").on(table.anonymousSessionId),
    index("recommendation_sessions_expires_at_idx").on(table.expiresAt),
    index("recommendation_sessions_user_id_idx").on(table.userId),
  ],
);

export const recommendationResults = pgTable(
  "recommendation_results",
  {
    id: uuidPrimaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => recommendationSessions.id, { onDelete: "cascade" }),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "restrict" }),
    rank: integer("rank").notNull(),
    score: numeric("score", { precision: 6, scale: 2 }).notNull(),
    reasonCodes: jsonb("reason_codes").$type<string[]>().notNull(),
    explanationSnapshot: text("explanation_snapshot").notNull(),
    algorithmVersion: text("algorithm_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("recommendation_results_session_rank_unique").on(table.sessionId, table.rank),
    unique("recommendation_results_session_book_unique").on(table.sessionId, table.bookId),
    check("recommendation_results_rank_range", sql`${table.rank} between 1 and 3`),
    check(
      "recommendation_results_score_range",
      sql`${table.score} between 0 and 100`,
    ),
    index("recommendation_results_book_id_idx").on(table.bookId),
  ],
);

export const recommendationFeedback = pgTable(
  "recommendation_feedback",
  {
    id: uuidPrimaryKey(),
    resultId: uuid("result_id")
      .notNull()
      .references(() => recommendationResults.id, { onDelete: "cascade" }),
    action: text("action", { enum: recommendationFeedbackActionValues }).notNull(),
    rating: integer("rating"),
    feedbackTags: text("feedback_tags").array().default(sql`'{}'::text[]`).notNull(),
    freeText: text("free_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("recommendation_feedback_result_action_unique").on(
      table.resultId,
      table.action,
    ),
    check(
      "recommendation_feedback_action_valid",
      sql`${table.action} in ('positive', 'negative', 'started', 'finished', 'rating')`,
    ),
    check(
      "recommendation_feedback_rating_valid",
      sql`(${table.action} = 'rating' and ${table.rating} between 1 and 5) or (${table.action} <> 'rating' and ${table.rating} is null)`,
    ),
    index("recommendation_feedback_created_at_idx").on(table.createdAt),
  ],
);

