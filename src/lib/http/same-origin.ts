import "server-only";

import { getServerEnv } from "@/lib/env/server";

export function isTrustedSameOriginMutation(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return fetchSite === null || fetchSite === "same-origin";

  try {
    const allowed = new Set([
      new URL(request.url).origin,
      new URL(getServerEnv().NEXT_PUBLIC_SITE_URL).origin,
    ]);
    return allowed.has(new URL(origin).origin);
  } catch {
    return false;
  }
}
