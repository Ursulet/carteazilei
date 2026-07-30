import "server-only";

import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";

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
      outcome: auditLogs.outcome,
      ipHash: auditLogs.ipHash,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(Math.min(Math.max(limit, 1), 250));
}

export async function getAuditEntries(filters: { q?: string; action?: string; outcome?: string }, limit = 250) {
  const conditions: SQL[] = [];
  const q = filters.q?.trim();
  const action = filters.action?.trim();
  if (q) conditions.push(or(ilike(auditLogs.action, `%${q}%`), ilike(auditLogs.entityType, `%${q}%`), ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))!);
  if (action) conditions.push(ilike(auditLogs.action, `%${action}%`));
  if (filters.outcome === "success" || filters.outcome === "failure") conditions.push(eq(auditLogs.outcome, filters.outcome));

  return getDb()
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      diff: auditLogs.diff,
      metadata: auditLogs.metadata,
      outcome: auditLogs.outcome,
      ipHash: auditLogs.ipHash,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(Math.min(Math.max(limit, 1), 500));
}
