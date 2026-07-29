import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  analyticsVisitorCookie,
  getAnalyticsVisitor,
} from "@/domain/analytics/tracking-service";
import {
  normalizeCommercialSourcePath,
  recordCommercialImpressions,
} from "@/domain/commercial/tracking-service";
import { readBoundedJson } from "@/lib/http/bounded-json";
import { isTrustedSameOriginMutation } from "@/lib/http/same-origin";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  offerIds: z.array(z.uuid()).min(1).max(20),
  sourceContext: z.enum(["book_page", "daily_feature", "recommendation", "other"]),
  sourcePath: z.string().max(500),
  dailyFeatureId: z.uuid().optional(),
  recommendationResultId: z.uuid().optional(),
});

function json(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("cache-control", "no-store");
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

export async function POST(request: NextRequest) {
  if (!isTrustedSameOriginMutation(request)) {
    return json({ ok: false }, { status: 403 });
  }

  const visitor = getAnalyticsVisitor(request.cookies.get(analyticsVisitorCookie)?.value);
  const rateLimit = await consumePublicRateLimit({
    scope: "commercial-impressions",
    headers: request.headers,
    fallbackIdentity: visitor.rawToken,
    maximumRequests: 90,
    windowMilliseconds: 60 * 1_000,
    blockMilliseconds: 2 * 60 * 1_000,
  });
  if (rateLimit.blocked) {
    const response = json({ ok: false }, { status: 429 });
    response.headers.set("retry-after", String(rateLimit.retryAfterSeconds));
    return response;
  }

  const body = await readBoundedJson(request);
  if (!body.ok) return json({ ok: false }, { status: body.status });

  const parsed = bodySchema.safeParse(body.value);
  if (!parsed.success) {
    return json({ ok: false }, { status: 400 });
  }
  try {
    const count = await recordCommercialImpressions(parsed.data.offerIds, {
      sourceContext: parsed.data.sourceContext,
      sourcePath: normalizeCommercialSourcePath(parsed.data.sourcePath),
      dailyFeatureId: parsed.data.dailyFeatureId,
      recommendationResultId: parsed.data.recommendationResultId,
    });
    return json({ ok: true, count });
  } catch (error) {
    console.error("Commercial impression tracking failed", error);
    return json({ ok: false }, { status: 500 });
  }
}
