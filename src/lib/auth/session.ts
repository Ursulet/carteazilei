import "server-only";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/service";

export async function revokeUserSessions({
  actorUserId,
  targetUserId,
}: {
  actorUserId: string;
  targetUserId: string;
}) {
  const actorId = z.uuid().parse(actorUserId);
  const targetId = z.uuid().parse(targetUserId);
  const db = getDb();

  await db.transaction(async (transaction) => {
    await transaction
      .update(users)
      .set({
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetId));

    await writeAuditLog(
      {
        actorUserId: actorId,
        action: "auth.sessions_revoked",
        entityType: "user",
        entityId: targetId,
      },
      transaction,
    );
  });
}
