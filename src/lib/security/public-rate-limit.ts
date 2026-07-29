import "server-only";

import { createHmac } from "node:crypto";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { recommendationRateLimits } from "@/db/schema";
import { getServerEnv } from "@/lib/env/server";

function clientIp(headers: Headers) {
  const candidate =
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (!candidate || candidate.length > 64 || !/^[0-9a-f.:]+$/i.test(candidate)) {
    return null;
  }

  return candidate;
}

function hashKey(value: string) {
  return createHmac("sha256", getServerEnv().AUTH_SECRET).update(value).digest("hex");
}

/**
 * Limitator persistent pentru endpointurile publice. Tabela istorică își păstrează
 * numele pentru compatibilitatea migrațiilor, iar `scope` separă fiecare flux.
 */
export async function consumePublicRateLimit({
  scope,
  headers,
  fallbackIdentity,
  maximumRequests,
  windowMilliseconds,
  blockMilliseconds = windowMilliseconds,
}: {
  scope: string;
  headers: Headers;
  fallbackIdentity?: string | null;
  maximumRequests: number;
  windowMilliseconds: number;
  blockMilliseconds?: number;
}) {
  const identity = clientIp(headers) ?? fallbackIdentity;
  if (!identity) return { blocked: false, retryAfterSeconds: 0 };

  const keyHash = hashKey(`${scope}:${identity}`);
  const db = getDb();
  const now = new Date();

  return db.transaction(async (transaction) => {
    await transaction
      .insert(recommendationRateLimits)
      .values({ keyHash, requests: 0, windowStartedAt: now, updatedAt: now })
      .onConflictDoNothing();

    const [current] = await transaction
      .select()
      .from(recommendationRateLimits)
      .where(eq(recommendationRateLimits.keyHash, keyHash))
      .for("update")
      .limit(1);

    if (!current) return { blocked: true, retryAfterSeconds: 60 };
    if (current.blockedUntil && current.blockedUntil > now) {
      return {
        blocked: true,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((current.blockedUntil.getTime() - now.getTime()) / 1_000),
        ),
      };
    }

    const windowExpired =
      now.getTime() - current.windowStartedAt.getTime() >= windowMilliseconds;
    const requests = windowExpired ? 1 : current.requests + 1;
    const blockedUntil =
      requests > maximumRequests ? new Date(now.getTime() + blockMilliseconds) : null;

    await transaction
      .update(recommendationRateLimits)
      .set({
        requests,
        windowStartedAt: windowExpired ? now : current.windowStartedAt,
        blockedUntil,
        updatedAt: now,
      })
      .where(eq(recommendationRateLimits.keyHash, keyHash));

    return {
      blocked: blockedUntil !== null,
      retryAfterSeconds: blockedUntil ? Math.ceil(blockMilliseconds / 1_000) : 0,
    };
  });
}
