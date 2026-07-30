import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { createCliDatabaseConnection } from "@/db/cli";
import { auditLogs, roles, userRoles, users } from "@/db/schema";
import { bootstrapPasswordSchema, hashPassword } from "@/lib/auth/password";

const bootstrapSchema = z.object({
  ALLOW_ADMIN_BOOTSTRAP: z.literal("true"),
  ADMIN_EMAIL: z.email().max(254).transform((value) => value.trim().toLowerCase()),
  ADMIN_NAME: z.string().trim().min(2).max(100),
  ADMIN_PASSWORD: bootstrapPasswordSchema,
});

async function createAdmin() {
  const input = bootstrapSchema.parse({
    ALLOW_ADMIN_BOOTSTRAP: process.env.ALLOW_ADMIN_BOOTSTRAP,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_NAME: process.env.ADMIN_NAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  });
  const passwordHash = await hashPassword(input.ADMIN_PASSWORD);
  const { db, client } = createCliDatabaseConnection();

  try {
    await db.transaction(async (transaction) => {
      const [existingUser] = await transaction
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            sql`lower(${users.email}) = lower(${input.ADMIN_EMAIL})`,
            isNull(users.deletedAt),
          ),
        )
        .limit(1);

      if (existingUser) {
        throw new Error("Există deja un utilizator activ cu această adresă.");
      }

      const [adminRole] = await transaction
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.code, "super_admin"))
        .limit(1);

      if (!adminRole) {
        throw new Error("Rolul Super Admin lipsește. Rulează mai întâi pnpm db:seed.");
      }

      const [createdUser] = await transaction
        .insert(users)
        .values({
          email: input.ADMIN_EMAIL,
          name: input.ADMIN_NAME,
          passwordHash,
          active: true,
          status: "active",
        })
        .returning({ id: users.id });

      if (!createdUser) {
        throw new Error("Contul administrator nu a putut fi creat.");
      }

      await transaction.insert(userRoles).values({
        userId: createdUser.id,
        roleId: adminRole.id,
        assignedBy: createdUser.id,
      });

      await transaction.insert(auditLogs).values({
        actorUserId: createdUser.id,
        action: "auth.bootstrap_admin",
        entityType: "user",
        entityId: createdUser.id,
        metadata: { mechanism: "explicit_cli_bootstrap" },
      });
    });

    console.info("Contul administrator a fost creat.");
  } finally {
    await client.end({ timeout: 5 });
  }
}

createAdmin().catch((error: unknown) => {
  console.error("Crearea administratorului a eșuat.", error);
  process.exitCode = 1;
});
