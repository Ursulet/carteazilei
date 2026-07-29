import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const authRateLimits = pgTable(
  "auth_rate_limits",
  {
    keyHash: text("key_hash").primaryKey(),
    attempts: integer("attempts").default(0).notNull(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    blockedUntil: timestamp("blocked_until", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("auth_rate_limits_attempts_positive", sql`${table.attempts} >= 0`),
    index("auth_rate_limits_updated_at_idx").on(table.updatedAt),
  ],
);
