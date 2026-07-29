import { NextRequest, NextResponse } from "next/server";

import {
  recommendationFeedbackInputSchema,
  saveRecommendationFeedback,
} from "@/domain/recommendation/feedback-service";
import { consumeRecommendationRateLimit } from "@/domain/recommendation/rate-limit";
import { RecommendationSessionError } from "@/domain/recommendation/session-service";
import { readBoundedJson } from "@/lib/http/bounded-json";
import { isTrustedSameOriginMutation } from "@/lib/http/same-origin";

export const dynamic = "force-dynamic";

function json(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("cache-control", "no-store");
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

export async function POST(request: NextRequest) {
  if (!isTrustedSameOriginMutation(request)) {
    return json({ ok: false, message: "Cerere respinsă." }, { status: 403 });
  }
  const body = await readBoundedJson(request);
  if (!body.ok) {
    return json({ ok: false, message: "Cererea nu este validă." }, { status: body.status });
  }
  const parsed = recommendationFeedbackInputSchema.safeParse(body.value);
  if (!parsed.success) {
    return json({ ok: false, message: "Feedbackul nu este valid." }, { status: 400 });
  }

  const limit = await consumeRecommendationRateLimit({
    scope: "recommendation-feedback",
    headers: request.headers,
    fallbackIdentity: parsed.data.resultToken,
    maximumRequests: 60,
    windowMilliseconds: 15 * 60 * 1_000,
  });
  if (limit.blocked) {
    const response = json(
      { ok: false, message: "Prea multe actualizări. Încearcă din nou peste puțin timp." },
      { status: 429 },
    );
    response.headers.set("retry-after", String(limit.retryAfterSeconds));
    return response;
  }

  try {
    await saveRecommendationFeedback(parsed.data);
    return json({ ok: true });
  } catch (error) {
    if (error instanceof RecommendationSessionError) {
      return json({ ok: false, message: error.message }, { status: error.statusCode });
    }
    console.error("Recommendation feedback failed", error);
    return json(
      { ok: false, message: "Feedbackul nu a putut fi salvat." },
      { status: 500 },
    );
  }
}
