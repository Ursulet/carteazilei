import { NextRequest, NextResponse } from "next/server";

import { searchPublicCatalog } from "@/db/queries/public-search";
import { publicSearchQuerySchema } from "@/domain/search/input";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";

export const dynamic = "force-dynamic";

function json(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("cache-control", "no-store");
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

export async function GET(request: NextRequest) {
  const rateLimit = await consumePublicRateLimit({
    scope: "public-catalog-search",
    headers: request.headers,
    maximumRequests: 40,
    windowMilliseconds: 60 * 1_000,
    blockMilliseconds: 2 * 60 * 1_000,
  });

  if (rateLimit.blocked) {
    const response = json(
      { ok: false, message: "Prea multe căutări. Încearcă din nou în curând." },
      { status: 429 },
    );
    response.headers.set("retry-after", String(rateLimit.retryAfterSeconds));
    return response;
  }

  const parsed = publicSearchQuerySchema.safeParse(request.nextUrl.searchParams.get("q"));
  if (!parsed.success) {
    return json({ ok: true, books: [], authors: [], guides: [] });
  }

  try {
    const results = await searchPublicCatalog(parsed.data, {
      bookLimit: 5,
      authorLimit: 4,
      guideLimit: 4,
    });
    return json({ ok: true, ...results });
  } catch {
    return json(
      { ok: false, message: "Căutarea nu este disponibilă momentan." },
      { status: 503 },
    );
  }
}
