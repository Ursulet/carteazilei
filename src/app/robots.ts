import type { MetadataRoute } from "next";

import { absolutePublicUrl } from "@/lib/seo/urls";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/go"] }],
    sitemap: absolutePublicUrl("/sitemap.xml"),
    host: absolutePublicUrl("/"),
  };
}
