import { NextRequest, NextResponse } from "next/server";

import { publicProductEventSchema } from "@/domain/analytics/event-contract";
import {
  analyticsVisitorCookie,
  analyticsVisitorMaxAgeSeconds,
  getAnalyticsVisitor,
  recordPublicProductEvent,
} from "@/domain/analytics/tracking-service";
import { getPublicSiteSettings } from "@/domain/settings/public-settings-service";
import { readBoundedJson } from "@/lib/http/bounded-json";
import { isTrustedSameOriginMutation } from "@/lib/http/same-origin";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";
import { cookieConsentName, hasAnalyticsConsent } from "@/lib/privacy/consent";

export const dynamic = "force-dynamic";

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

  const settings = await getPublicSiteSettings();
  if (!settings.analyticsEnabled || !hasAnalyticsConsent(request.cookies.get(cookieConsentName)?.value)) {
    return json({ ok: false }, { status: 403 });
  }

  const visitor = getAnalyticsVisitor(request.cookies.get(analyticsVisitorCookie)?.value);
  const rateLimit = await consumePublicRateLimit({
    scope: "public-product-events",
    headers: request.headers,
    fallbackIdentity: visitor.rawToken,
    maximumRequests: 120,
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

  const parsed = publicProductEventSchema.safeParse(body.value);
  if (!parsed.success) return json({ ok: false }, { status: 400 });

  try {
    const accepted = await recordPublicProductEvent(
      parsed.data,
      visitor.anonymousSessionId,
    );
    const response = json({ ok: accepted }, { status: accepted ? 202 : 404 });
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
  } catch {
    return json({ ok: false }, { status: 500 });
  }
}
