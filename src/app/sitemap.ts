import type { MetadataRoute } from "next";

import { getPublicSitemapEntries } from "@/db/queries/public-sitemap";
import { absolutePublicUrl } from "@/lib/seo/urls";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getPublicSitemapEntries();
  const dynamicEntries = [
    ...entries.books,
    ...entries.authors,
    ...entries.editors,
    ...entries.daily,
    ...entries.hubs,
  ].map((entry) => ({
    url: absolutePublicUrl(entry.href),
    lastModified: entry.lastModified,
    changeFrequency: "monthly" as const,
  }));
  const staticPaths = [
    "/",
    "/recomanda-mi",
    "/cartea-zilei/arhiva",
    "/carti",
    "/autori",
    "/echipa",
    "/liste",
    "/despre",
    "/cum-recomandam",
    "/politica-editoriala",
    "/afiliere",
    "/contact",
    "/legal/confidentialitate",
  ];
  return [
    ...staticPaths.map((path) => ({ url: absolutePublicUrl(path), changeFrequency: "weekly" as const })),
    ...dynamicEntries,
  ];
}
