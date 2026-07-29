import "server-only";

import { createHmac } from "node:crypto";

import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import { authRateLimits } from "@/db/schema";
import { getServerEnv } from "@/lib/env/server";

type HeaderMap = Record<string, string | undefined>;

type RateLimitRule = {
  keyHash: string;
  maximumAttempts: number;
  windowMilliseconds: number;
  blockMilliseconds: number;
};

function normalizedHeader(headers: HeaderMap, name: string) {
  return headers[name] ?? headers[name.toLowerCase()];
}

function clientIpFromHeaders(headers: HeaderMap) {
  const candidate =
    normalizedHeader(headers, "cf-connecting-ip") ??
    normalizedHeader(headers, "x-real-ip") ??
    normalizedHeader(headers, "x-forwarded-for")?.split(",")[0]?.trim();

  if (!candidate || candidate.length > 64 || !/^[0-9a-f.:]+$/i.test(candidate)) {
    return null;
  }

  return candidate;
}

function hashRateLimitKey(value: string) {
  return createHmac("sha256", getServerEnv().AUTH_SECRET).update(value).digest("hex");
}

async function consumeRule(rule: RateLimitRule) {
  const db = getDb();
  const now = new Date();

  return db.transaction(async (transaction) => {
    await transaction
      .insert(authRateLimits)
      .values({
        keyHash: rule.keyHash,
        attempts: 0,
        windowStartedAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    const [current] = await transaction
      .select()
      .from(authRateLimits)
      .where(eq(authRateLimits.keyHash, rule.keyHash))
      .for("update")
      .limit(1);

    if (!current) {
      return true;
    }

    if (current.blockedUntil && current.blockedUntil > now) {
      return true;
    }

    const windowExpired =
      now.getTime() - current.windowStartedAt.getTime() >= rule.windowMilliseconds;
    const attempts = windowExpired ? 1 : current.attempts + 1;
    const blockedUntil =
      attempts > rule.maximumAttempts
        ? new Date(now.getTime() + rule.blockMilliseconds)
        : null;

    await transaction
      .update(authRateLimits)
      .set({
        attempts,
        windowStartedAt: windowExpired ? now : current.windowStartedAt,
        blockedUntil,
        updatedAt: now,
      })
      .where(eq(authRateLimits.keyHash, rule.keyHash));

    return blockedUntil !== null;
  });
}

export async function consumeLoginRateLimit(email: string, headers: HeaderMap) {
  const clientIp = clientIpFromHeaders(headers);
  const credentialKey = hashRateLimitKey(`credential:${clientIp ?? "unknown"}:${email}`);
  const rules: RateLimitRule[] = [
    {
      keyHash: credentialKey,
      maximumAttempts: 5,
      windowMilliseconds: 15 * 60 * 1_000,
      blockMilliseconds: 15 * 60 * 1_000,
    },
  ];

  if (clientIp) {
    rules.push({
      keyHash: hashRateLimitKey(`ip:${clientIp}`),
      maximumAttempts: 25,
      windowMilliseconds: 15 * 60 * 1_000,
      blockMilliseconds: 15 * 60 * 1_000,
    });
  }

  const decisions = [];

  for (const rule of rules) {
    decisions.push(await consumeRule(rule));
  }

  return {
    blocked: decisions.some(Boolean),
    keyHashes: rules.map((rule) => rule.keyHash),
  };
}

export async function clearLoginRateLimit(keyHashes: string[]) {
  if (keyHashes.length === 0) {
    return;
  }

  await getDb().delete(authRateLimits).where(inArray(authRateLimits.keyHash, keyHashes));
}

