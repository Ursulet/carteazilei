import { NextRequest, NextResponse } from "next/server";

import { consumeRecommendationRateLimit } from "@/domain/recommendation/rate-limit";
import { generateRecommendationResults } from "@/domain/recommendation/result-service";
import {
  completeRecommendationSession,
  RecommendationSessionError,
  recommendationSessionCookie,
} from "@/domain/recommendation/session-service";
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
  const sessionToken = request.cookies.get(recommendationSessionCookie)?.value;
  const limit = await consumeRecommendationRateLimit({
    scope: "recommendation-session-complete",
    headers: request.headers,
    fallbackIdentity: sessionToken,
    maximumRequests: 20,
    windowMilliseconds: 15 * 60 * 1_000,
  });
  if (limit.blocked) {
    const response = json(
      { ok: false, message: "Prea multe cereri. Așteaptă puțin și încearcă din nou." },
      { status: 429 },
    );
    response.headers.set("retry-after", String(limit.retryAfterSeconds));
    return response;
  }

  try {
    const session = await completeRecommendationSession(sessionToken);
    const result = await generateRecommendationResults(sessionToken);
    return json({ ok: true, session, resultPath: result.resultPath });
  } catch (error) {
    if (error instanceof RecommendationSessionError) {
      return json({ ok: false, message: error.message }, { status: error.statusCode });
    }
    console.error("Recommendation completion failed", error);
    return json(
      { ok: false, message: "Profilul de lectură nu a putut fi finalizat." },
      { status: 500 },
    );
  }
}
