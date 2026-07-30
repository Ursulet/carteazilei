import "server-only";

import { createHmac, randomBytes } from "node:crypto";

import { and, eq, isNull, lte, or } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  authors,
  books,
  dailyFeatures,
  productEvents,
  recommendationResults,
  recommendationSessions,
} from "@/db/schema";
import { publicBookPageEligibility, publishedBookConditions } from "@/db/queries/public-book-pages";
import { getEditorialDate } from "@/domain/editorial/bucharest-date";
import { getServerEnv } from "@/lib/env/server";

import type { PublicProductEventInput } from "./event-contract";
import { publicResultTokenHash } from "../recommendation/result-service";

export const analyticsVisitorCookie = "cz_analytics_session";
export const analyticsVisitorMaxAgeSeconds = 30 * 24 * 60 * 60;

const rawTokenPattern = /^[A-Za-z0-9_-]{24,128}$/;

export function normalizeAnalyticsSourcePath(value: string) {
  if (value.length > 500 || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value.split("?")[0]?.split("#")[0] || "/";
}

export function getAnalyticsVisitor(rawToken: string | null | undefined) {
  const token = rawToken && rawTokenPattern.test(rawToken)
    ? rawToken
    : randomBytes(24).toString("base64url");
  return {
    rawToken: token,
    created: token !== rawToken,
    anonymousSessionId: createHmac("sha256", getServerEnv().AUTH_SECRET)
      .update(`analytics:${token}`)
      .digest("hex"),
  };
}

function eventDay() {
  return new Date().toISOString().slice(0, 10);
}

const organicReferrerPatterns = [
  /(^|\.)google\.[a-z.]+$/,
  /(^|\.)bing\.com$/,
  /(^|\.)duckduckgo\.com$/,
  /(^|\.)search\.yahoo\.com$/,
  /(^|\.)ecosia\.org$/,
  /(^|\.)search\.brave\.com$/,
  /(^|\.)yandex\.[a-z.]+$/,
];

function classifyAcquisition(referrerHost: string | undefined) {
  if (!referrerHost) return "direct" as const;
  const siteHost = new URL(getServerEnv().NEXT_PUBLIC_SITE_URL).hostname.toLowerCase();
  if (
    referrerHost === siteHost ||
    referrerHost.endsWith(`.${siteHost}`) ||
    siteHost.endsWith(`.${referrerHost}`)
  ) {
    return "internal" as const;
  }
  if (organicReferrerPatterns.some((pattern) => pattern.test(referrerHost))) {
    return "organic" as const;
  }
  return "referral" as const;
}

async function recommendationResultContext(
  resultToken: string,
  resultId: string,
  db: Database,
) {
  const [row] = await db
    .select({
      sessionId: recommendationSessions.id,
      anonymousSessionId: recommendationSessions.anonymousSessionId,
      resultId: recommendationResults.id,
      bookId: recommendationResults.bookId,
      rank: recommendationResults.rank,
      algorithmVersion: recommendationResults.algorithmVersion,
    })
    .from(recommendationResults)
    .innerJoin(
      recommendationSessions,
      eq(recommendationSessions.id, recommendationResults.sessionId),
    )
    .where(
      and(
        eq(recommendationResults.id, resultId),
        eq(recommendationSessions.resultTokenHash, publicResultTokenHash(resultToken)),
        eq(recommendationSessions.status, "completed"),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Validează referințele publice înainte de a scrie un eveniment client-side. */
export async function recordPublicProductEvent(
  input: PublicProductEventInput,
  visitorId: string,
  db: Database = getDb(),
) {
  const sourcePath = normalizeAnalyticsSourcePath(input.sourcePath);

  if (input.event === "page_viewed") {
    const acquisitionChannel = classifyAcquisition(input.referrerHost);
    await db.insert(productEvents).values({
      eventName: input.event,
      anonymousSessionId: visitorId,
      sourcePath,
      acquisitionChannel,
      referrerHost: input.referrerHost,
      isLanding: input.isLanding,
    });
    return true;
  }

  if (input.event === "recommendation_result_shown") {
    const context = await recommendationResultContext(input.resultToken, input.resultId, db);
    if (!context) return false;
    await db.insert(productEvents).values({
      eventName: input.event,
      anonymousSessionId: context.anonymousSessionId,
      recommendationSessionId: context.sessionId,
      recommendationResultId: context.resultId,
      bookId: context.bookId,
      resultRank: context.rank,
      algorithmVersion: context.algorithmVersion,
      sourcePath,
      dedupeKey: `result-shown:${context.sessionId}:${context.resultId}`,
    }).onConflictDoNothing({ target: productEvents.dedupeKey });
    return true;
  }

  if (input.event === "recommendation_alternative_requested") {
    const [from, target] = await Promise.all([
      recommendationResultContext(input.resultToken, input.fromResultId, db),
      recommendationResultContext(input.resultToken, input.resultId, db),
    ]);
    if (!from || !target || from.sessionId !== target.sessionId || target.rank <= from.rank) return false;
    await db.insert(productEvents).values({
      eventName: input.event,
      anonymousSessionId: target.anonymousSessionId,
      recommendationSessionId: target.sessionId,
      recommendationResultId: target.resultId,
      bookId: target.bookId,
      resultRank: target.rank,
      algorithmVersion: target.algorithmVersion,
      sourcePath,
      dedupeKey: `alternative:${target.sessionId}:${from.resultId}:${target.resultId}`,
    }).onConflictDoNothing({ target: productEvents.dedupeKey });
    return true;
  }

  if (input.event === "book_viewed") {
    const [book] = await db
      .select({ id: books.id })
      .from(books)
      .innerJoin(authors, eq(authors.id, books.primaryAuthorId))
      .where(and(eq(books.id, input.bookId), publishedBookConditions, publicBookPageEligibility))
      .limit(1);
    if (!book) return false;
    await db.insert(productEvents).values({
      eventName: input.event,
      anonymousSessionId: visitorId,
      bookId: book.id,
      sourcePath,
      dedupeKey: `book-view:${visitorId}:${book.id}:${eventDay()}`,
    }).onConflictDoNothing({ target: productEvents.dedupeKey });
    return true;
  }

  const [feature] = await db
    .select({ id: dailyFeatures.id, bookId: dailyFeatures.bookId })
    .from(dailyFeatures)
    .innerJoin(books, eq(books.id, dailyFeatures.bookId))
    .where(and(
      eq(dailyFeatures.id, input.dailyFeatureId),
      eq(dailyFeatures.bookId, input.bookId),
      or(
        eq(dailyFeatures.status, "published"),
        eq(dailyFeatures.status, "scheduled"),
      ),
      lte(dailyFeatures.featureDate, getEditorialDate()),
      isNull(dailyFeatures.deletedAt),
      eq(books.status, "published"),
      isNull(books.deletedAt),
    ))
    .limit(1);
  if (!feature) return false;
  await db.insert(productEvents).values({
    eventName: input.event,
    anonymousSessionId: visitorId,
    bookId: feature.bookId,
    dailyFeatureId: feature.id,
    sourcePath,
    dedupeKey: `daily-view:${visitorId}:${feature.id}:${eventDay()}`,
  }).onConflictDoNothing({ target: productEvents.dedupeKey });
  return true;
}
