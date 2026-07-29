import "server-only";

import { z } from "zod";

import { getDb } from "@/db";
import { getAuthUserByEmail } from "@/db/queries/auth-users";
import { writeAuditLog } from "@/lib/audit/service";
import { verifyPassword } from "@/lib/auth/password";
import {
  clearLoginRateLimit,
  consumeLoginRateLimit,
} from "@/lib/auth/rate-limit";

type HeaderMap = Record<string, string | undefined>;

const loginCredentialsSchema = z.object({
  email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(128),
});

export async function authenticateInternalUser(
  rawCredentials: unknown,
  headers: HeaderMap,
) {
  const parsed = loginCredentialsSchema.safeParse(rawCredentials);
  const fallbackPassword =
    typeof (rawCredentials as { password?: unknown } | null)?.password === "string"
      ? String((rawCredentials as { password: string }).password).slice(0, 128)
      : "invalid-credential";
  const email = parsed.success ? parsed.data.email : "invalid@credential.local";
  const password = parsed.success ? parsed.data.password : fallbackPassword;
  const rateLimit = await consumeLoginRateLimit(email, headers);

  if (rateLimit.blocked || !parsed.success) {
    await verifyPassword(null, password);
    return null;
  }

  const account = await getAuthUserByEmail(getDb(), email);
  const validPassword = await verifyPassword(account?.passwordHash ?? null, password);

  if (!account || !validPassword || account.roles.length === 0) {
    return null;
  }

  await clearLoginRateLimit(rateLimit.keyHashes);
  await writeAuditLog({
    actorUserId: account.id,
    action: "auth.sign_in",
    entityType: "user",
    entityId: account.id,
    metadata: { roles: account.roles },
  });

  return {
    id: account.id,
    email: account.email,
    name: account.name,
    image: null,
    sessionVersion: account.sessionVersion,
  };
}

