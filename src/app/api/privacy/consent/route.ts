import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { analyticsVisitorCookie } from "@/domain/analytics/tracking-service";
import { getPublicSiteSettings } from "@/domain/settings/public-settings-service";
import { readBoundedJson } from "@/lib/http/bounded-json";
import { isTrustedSameOriginMutation } from "@/lib/http/same-origin";
import {
  cookieConsentMaxAgeSeconds,
  cookieConsentName,
  serializeCookieConsent,
} from "@/lib/privacy/consent";

export const dynamic = "force-dynamic";

const consentSchema = z.object({ choice: z.enum(["necessary", "analytics"]) });

function json(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("cache-control", "no-store");
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

export async function POST(request: NextRequest) {
  if (!isTrustedSameOriginMutation(request)) return json({ ok: false }, { status: 403 });
  const body = await readBoundedJson(request);
  if (!body.ok) return json({ ok: false }, { status: body.status });
  const parsed = consentSchema.safeParse(body.value);
  if (!parsed.success) return json({ ok: false }, { status: 400 });

  const settings = await getPublicSiteSettings();
  const choice = parsed.data.choice === "analytics" && settings.analyticsEnabled
    ? "analytics"
    : "necessary";
  const response = json({ ok: true, choice });
  response.cookies.set(cookieConsentName, serializeCookieConsent(choice), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookieConsentMaxAgeSeconds,
  });
  if (choice === "necessary") {
    response.cookies.set(analyticsVisitorCookie, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}
