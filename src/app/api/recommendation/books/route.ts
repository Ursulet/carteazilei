import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/db";
import { searchPublishedBooks } from "@/db/queries/search-books";
import { consumeRecommendationRateLimit } from "@/domain/recommendation/rate-limit";
import {
  getRecommendationSessionByRawToken,
  recommendationSessionCookie,
} from "@/domain/recommendation/session-service";

export const dynamic = "force-dynamic";

const querySchema = z.string().trim().min(2).max(80);

function json(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("cache-control", "no-store");
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(recommendationSessionCookie)?.value;
  const limit = await consumeRecommendationRateLimit({
    scope: "recommendation-book-search",
    headers: request.headers,
    fallbackIdentity: sessionToken,
    maximumRequests: 60,
    windowMilliseconds: 60 * 1_000,
  });
  if (limit.blocked) {
    const response = json(
      { ok: false, message: "Prea multe căutări. Așteaptă puțin." },
      { status: 429 },
    );
    response.headers.set("retry-after", String(limit.retryAfterSeconds));
    return response;
  }

  const session = await getRecommendationSessionByRawToken(sessionToken);
  if (!session || session.status !== "started") {
    return json({ ok: false, message: "Sesiunea nu este activă." }, { status: 401 });
  }

  const parsed = querySchema.safeParse(request.nextUrl.searchParams.get("q"));
  if (!parsed.success) return json({ ok: true, books: [] });

  const rows = await searchPublishedBooks(getDb(), { query: parsed.data, limit: 8 });
  return json({
    ok: true,
    books: rows.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author.name,
    })),
  });
}
