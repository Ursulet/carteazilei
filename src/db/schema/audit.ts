import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { uuidPrimaryKey } from "./common";
import { users } from "./identity";

export type AuditMetadata = Record<string, unknown>;

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuidPrimaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    diff: jsonb("diff").$type<AuditMetadata>(),
    metadata: jsonb("metadata").$type<AuditMetadata>(),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    outcome: text("outcome").default("success").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_actor_created_idx").on(table.actorUserId, table.createdAt),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);
