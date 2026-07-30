import "server-only";

import { z } from "zod";

import { getDb, type Database } from "@/db";
import { auditLogs, type AuditMetadata } from "@/db/schema";

const auditInputSchema = z.object({
  actorUserId: z.uuid().nullable(),
  action: z.string().min(1).max(100),
  entityType: z.string().min(1).max(100),
  entityId: z.uuid().nullable().optional(),
  diff: z.unknown().optional(),
  metadata: z.unknown().optional(),
  ipHash: z.string().max(128).nullable().optional(),
  userAgent: z.string().max(500).nullable().optional(),
  outcome: z.enum(["success", "failure"]).optional(),
});

const forbiddenKey = /password|secret|token|authorization|cookie/i;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 5) {
    return "[TRUNCAT]";
  }

  if (typeof value === "string") {
    return value.slice(0, 2_000);
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 100)
        .map(([key, nestedValue]) => [
          key,
          forbiddenKey.test(key) ? "[REDACTAT]" : sanitizeValue(nestedValue, depth + 1),
        ]),
    );
  }

  return String(value).slice(0, 2_000);
}

function sanitizeObject(value: unknown): AuditMetadata | undefined {
  if (value === undefined) {
    return undefined;
  }

  const sanitized = sanitizeValue(value);
  return typeof sanitized === "object" && sanitized !== null && !Array.isArray(sanitized)
    ? (sanitized as AuditMetadata)
    : { value: sanitized };
}

export type AuditInput = z.input<typeof auditInputSchema>;

export async function writeAuditLog(
  input: AuditInput,
  db: Pick<Database, "insert"> = getDb(),
) {
  const parsed = auditInputSchema.parse(input);

  await db.insert(auditLogs).values({
    actorUserId: parsed.actorUserId,
    action: parsed.action,
    entityType: parsed.entityType,
    entityId: parsed.entityId,
    diff: sanitizeObject(parsed.diff),
    metadata: sanitizeObject(parsed.metadata),
    ipHash: parsed.ipHash,
    userAgent: parsed.userAgent,
    outcome: parsed.outcome ?? "success",
  });
}
