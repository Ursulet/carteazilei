import "server-only";

import { getPublicEnv } from "@/lib/env/public";

export function absolutePublicUrl(pathname: string) {
  return new URL(pathname, getPublicEnv().NEXT_PUBLIC_SITE_URL).toString();
}
