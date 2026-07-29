import "server-only";

import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { auditLogs, users } from "@/db/schema";

export async function getRecentAuditEntries(limit = 100) {
  return getDb()
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      diff: auditLogs.diff,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(Math.min(Math.max(limit, 1), 250));
}
