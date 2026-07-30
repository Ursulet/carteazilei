import "server-only";

import { and, eq, inArray, isNull, lte, or } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  bookEditions,
  bookOffers,
  commercialClickEvents,
  commercialImpressionEvents,
  dailyFeatures,
  productEvents,
  recommendationResults,
  recommendationSessions,
  retailers,
} from "@/db/schema";
import type { commercialClickContextValues } from "@/db/schema/common";
import { getEditorialDate } from "@/domain/editorial/bucharest-date";

export type CommercialSourceContext = (typeof commercialClickContextValues)[number];

export type CommercialTrackingContext = {
  sourceContext: CommercialSourceContext;
  sourcePath: string;
  dailyFeatureId?: string;
  recommendationResultId?: string;
};

export function normalizeCommercialSourcePath(value: string | null | undefined) {
  if (!value || value.length > 500 || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value.split("?")[0]?.split("#")[0] || "/";
}

async function validateContextBook(
  db: Database,
  bookId: string,
  context: CommercialTrackingContext,
) {
  if (context.sourceContext === "daily_feature") {
    if (!context.dailyFeatureId) return false;
    const [feature] = await db
      .select({ id: dailyFeatures.id })
      .from(dailyFeatures)
      .where(
        and(
          eq(dailyFeatures.id, context.dailyFeatureId),
          eq(dailyFeatures.bookId, bookId),
          or(
            eq(dailyFeatures.status, "published"),
            eq(dailyFeatures.status, "scheduled"),
          ),
          lte(dailyFeatures.featureDate, getEditorialDate()),
          isNull(dailyFeatures.deletedAt),
        ),
      )
      .limit(1);
    return Boolean(feature);
  }

  if (context.sourceContext === "recommendation") {
    if (!context.recommendationResultId) return false;
    const [result] = await db
      .select({ id: recommendationResults.id })
      .from(recommendationResults)
      .where(
        and(
          eq(recommendationResults.id, context.recommendationResultId),
          eq(recommendationResults.bookId, bookId),
        ),
      )
      .limit(1);
    return Boolean(result);
  }

  return !context.dailyFeatureId && !context.recommendationResultId;
}

export async function resolveTrackableOffer(
  offerId: string,
  context: CommercialTrackingContext,
  db: Database = getDb(),
) {
  const [offer] = await db
    .select({
      offerId: bookOffers.id,
      bookId: bookEditions.bookId,
      partnerId: retailers.id,
      purchaseUrl: bookOffers.purchaseUrl,
    })
    .from(bookOffers)
    .innerJoin(bookEditions, eq(bookEditions.id, bookOffers.editionId))
    .innerJoin(retailers, eq(retailers.id, bookOffers.retailerId))
    .where(
      and(
        eq(bookOffers.id, offerId),
        eq(bookOffers.active, true),
        isNull(bookOffers.deletedAt),
        eq(bookEditions.active, true),
        isNull(bookEditions.deletedAt),
        eq(retailers.active, true),
        isNull(retailers.deletedAt),
      ),
    )
    .limit(1);
  if (!offer || !(await validateContextBook(db, offer.bookId, context))) return null;
  return offer;
}

export async function recordCommercialClick(
  offer: NonNullable<Awaited<ReturnType<typeof resolveTrackableOffer>>>,
  context: CommercialTrackingContext,
  anonymousSessionId?: string | null,
  db: Database = getDb(),
) {
  await db.insert(commercialClickEvents).values({
    bookId: offer.bookId,
    partnerId: offer.partnerId,
    offerId: offer.offerId,
    sourceContext: context.sourceContext,
    sourcePath: normalizeCommercialSourcePath(context.sourcePath),
    dailyFeatureId: context.dailyFeatureId ?? null,
    recommendationResultId: context.recommendationResultId ?? null,
  });

  try {
    const [recommendation] = context.recommendationResultId
      ? await db
          .select({
            sessionId: recommendationResults.sessionId,
            anonymousSessionId: recommendationSessions.anonymousSessionId,
            rank: recommendationResults.rank,
            algorithmVersion: recommendationResults.algorithmVersion,
          })
          .from(recommendationResults)
          .innerJoin(
            recommendationSessions,
            eq(recommendationSessions.id, recommendationResults.sessionId),
          )
          .where(eq(recommendationResults.id, context.recommendationResultId))
          .limit(1)
      : [];
    await db.insert(productEvents).values({
      eventName: "retailer_click",
      anonymousSessionId: recommendation?.anonymousSessionId ?? anonymousSessionId ?? null,
      recommendationSessionId: recommendation?.sessionId ?? null,
      recommendationResultId: context.recommendationResultId ?? null,
      bookId: offer.bookId,
      offerId: offer.offerId,
      resultRank: recommendation?.rank ?? null,
      algorithmVersion: recommendation?.algorithmVersion ?? null,
      sourcePath: normalizeCommercialSourcePath(context.sourcePath),
    });
  } catch {
    // Evenimentul comercial specializat rămâne sursa critică dacă jurnalul agregat e indisponibil.
  }
}

export async function recordCommercialImpressions(
  offerIds: string[],
  context: CommercialTrackingContext,
  db: Database = getDb(),
) {
  const uniqueIds = [...new Set(offerIds)].slice(0, 20);
  if (!uniqueIds.length) return 0;
  const offers = await db
    .select({
      offerId: bookOffers.id,
      bookId: bookEditions.bookId,
      partnerId: retailers.id,
    })
    .from(bookOffers)
    .innerJoin(bookEditions, eq(bookEditions.id, bookOffers.editionId))
    .innerJoin(retailers, eq(retailers.id, bookOffers.retailerId))
    .where(
      and(
        inArray(bookOffers.id, uniqueIds),
        eq(bookOffers.active, true),
        isNull(bookOffers.deletedAt),
        eq(bookEditions.active, true),
        isNull(bookEditions.deletedAt),
        eq(retailers.active, true),
        isNull(retailers.deletedAt),
      ),
    );
  const valid = [];
  for (const offer of offers) {
    if (await validateContextBook(db, offer.bookId, context)) valid.push(offer);
  }
  if (!valid.length) return 0;
  await db.insert(commercialImpressionEvents).values(
    valid.map((offer) => ({
      bookId: offer.bookId,
      partnerId: offer.partnerId,
      offerId: offer.offerId,
      sourceContext: context.sourceContext,
      sourcePath: normalizeCommercialSourcePath(context.sourcePath),
      dailyFeatureId: context.dailyFeatureId ?? null,
      recommendationResultId: context.recommendationResultId ?? null,
    })),
  );
  return valid.length;
}
