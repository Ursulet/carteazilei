import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { recommendationStepPayloadSchema } from "@/domain/recommendation/input";
import { consumeRecommendationRateLimit } from "@/domain/recommendation/rate-limit";
import {
  createOrResumeRecommendationSession,
  recommendationAnonymousCookie,
  recommendationAnonymousMaxAgeSeconds,
  RecommendationSessionError,
  recommendationSessionCookie,
  recommendationSessionMaxAgeSeconds,
  saveRecommendationStep,
} from "@/domain/recommendation/session-service";
import { readBoundedJson } from "@/lib/http/bounded-json";
import { isTrustedSameOriginMutation } from "@/lib/http/same-origin";

export const dynamic = "force-dynamic";

const startSchema = z.object({
  branch: z.literal("self"),
  forceNew: z.boolean().optional(),
});

function json(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("cache-control", "no-store");
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

function sessionError(error: unknown) {
  if (error instanceof RecommendationSessionError) {
    return json({ ok: false, message: error.message }, { status: error.statusCode });
  }
  console.error("Recommendation session request failed", error);
  return json(
    { ok: false, message: "Sesiunea nu a putut fi actualizată." },
    { status: 500 },
  );
}

function setSessionCookies(
  response: NextResponse,
  values: { rawSessionToken: string; rawAnonymousToken: string },
) {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(recommendationSessionCookie, values.rawSessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: recommendationSessionMaxAgeSeconds,
  });
  response.cookies.set(recommendationAnonymousCookie, values.rawAnonymousToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: recommendationAnonymousMaxAgeSeconds,
  });
}

export async function POST(request: NextRequest) {
  if (!isTrustedSameOriginMutation(request)) {
    return json({ ok: false, message: "Cerere respinsă." }, { status: 403 });
  }
  const body = await readBoundedJson(request);
  if (!body.ok) {
    return json({ ok: false, message: "Cererea nu este validă." }, { status: body.status });
  }
  const parsed = startSchema.safeParse(body.value);
  if (!parsed.success) {
    return json({ ok: false, message: "Ramura selectată nu este disponibilă." }, { status: 400 });
  }

  const anonymousToken = request.cookies.get(recommendationAnonymousCookie)?.value;
  const limit = await consumeRecommendationRateLimit({
    scope: "recommendation-session-start",
    headers: request.headers,
    fallbackIdentity: anonymousToken,
    maximumRequests: 12,
    windowMilliseconds: 60 * 60 * 1_000,
  });
  if (limit.blocked) {
    const response = json(
      { ok: false, message: "Ai început prea multe sesiuni. Încearcă din nou mai târziu." },
      { status: 429 },
    );
    response.headers.set("retry-after", String(limit.retryAfterSeconds));
    return response;
  }

  try {
    const result = await createOrResumeRecommendationSession({
      rawSessionToken: request.cookies.get(recommendationSessionCookie)?.value,
      rawAnonymousToken: anonymousToken,
      forceNew: parsed.data.forceNew,
    });
    const response = json({ ok: true, session: result.session });
    setSessionCookies(response, result);
    return response;
  } catch (error) {
    return sessionError(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedSameOriginMutation(request)) {
    return json({ ok: false, message: "Cerere respinsă." }, { status: 403 });
  }
  const body = await readBoundedJson(request);
  if (!body.ok) {
    return json({ ok: false, message: "Cererea nu este validă." }, { status: body.status });
  }
  const parsed = recommendationStepPayloadSchema.safeParse(body.value);
  if (!parsed.success) {
    return json({ ok: false, message: "Răspunsul nu este valid." }, { status: 400 });
  }
  const sessionToken = request.cookies.get(recommendationSessionCookie)?.value;
  const limit = await consumeRecommendationRateLimit({
    scope: "recommendation-session-update",
    headers: request.headers,
    fallbackIdentity: sessionToken,
    maximumRequests: 120,
    windowMilliseconds: 15 * 60 * 1_000,
  });
  if (limit.blocked) {
    const response = json(
      { ok: false, message: "Prea multe actualizări. Așteaptă puțin și încearcă din nou." },
      { status: 429 },
    );
    response.headers.set("retry-after", String(limit.retryAfterSeconds));
    return response;
  }

  try {
    const session = await saveRecommendationStep(sessionToken, parsed.data);
    return json({ ok: true, session });
  } catch (error) {
    return sessionError(error);
  }
}
