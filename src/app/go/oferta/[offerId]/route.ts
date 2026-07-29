import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  analyticsVisitorCookie,
  analyticsVisitorMaxAgeSeconds,
  getAnalyticsVisitor,
} from "@/domain/analytics/tracking-service";
import {
  normalizeCommercialSourcePath,
  recordCommercialClick,
  resolveTrackableOffer,
} from "@/domain/commercial/tracking-service";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  sourceContext: z.enum(["book_page", "daily_feature", "recommendation", "other"]),
  sourcePath: z.string().max(500),
  dailyFeatureId: z.uuid().optional(),
  recommendationResultId: z.uuid().optional(),
});

function externalPurchaseUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function unavailable(message: string, status: 404 | 429 = 404) {
  const response = new NextResponse(message, { status });
  response.headers.set("cache-control", "no-store");
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> },
) {
  const { offerId } = await params;
  if (!z.uuid().safeParse(offerId).success) {
    return unavailable("Oferta nu există.");
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    sourceContext: url.searchParams.get("context"),
    sourcePath: url.searchParams.get("from") || "/",
    dailyFeatureId: url.searchParams.get("daily") || undefined,
    recommendationResultId: url.searchParams.get("recommendation") || undefined,
  });
  if (!parsed.success) return unavailable("Context invalid.");

  const visitor = getAnalyticsVisitor(request.cookies.get(analyticsVisitorCookie)?.value);
  const rateLimit = await consumePublicRateLimit({
    scope: "retailer-redirect",
    headers: request.headers,
    fallbackIdentity: visitor.rawToken,
    maximumRequests: 60,
    windowMilliseconds: 60 * 1_000,
    blockMilliseconds: 2 * 60 * 1_000,
  });
  if (rateLimit.blocked) {
    const response = unavailable("Prea multe cereri. Încearcă din nou în curând.", 429);
    response.headers.set("retry-after", String(rateLimit.retryAfterSeconds));
    return response;
  }

  const context = {
    ...parsed.data,
    sourcePath: normalizeCommercialSourcePath(parsed.data.sourcePath),
  };
  const offer = await resolveTrackableOffer(offerId, context);
  if (!offer) return unavailable("Oferta nu mai este disponibilă.");

  const purchaseUrl = externalPurchaseUrl(offer.purchaseUrl);
  if (!purchaseUrl) return unavailable("Oferta nu mai este disponibilă.");

  try {
    await recordCommercialClick(offer, context, visitor.anonymousSessionId);
  } catch (error) {
    console.error("Commercial click tracking failed", error);
  }

  const response = NextResponse.redirect(purchaseUrl, 302);
  response.headers.set("cache-control", "no-store");
  response.headers.set("x-robots-tag", "noindex, nofollow");
  if (visitor.created) {
    response.cookies.set(analyticsVisitorCookie, visitor.rawToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: analyticsVisitorMaxAgeSeconds,
    });
  }
  return response;
}
