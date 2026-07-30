import type { MetadataRoute } from "next";
import { getPublicSiteSettings } from "@/domain/settings/public-settings-service";
export default async function robots(): Promise<MetadataRoute.Robots> { const settings = await getPublicSiteSettings(); return { rules: settings.indexingEnabled ? [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/go"] }] : [{ userAgent: "*", disallow: "/" }], sitemap: `${settings.canonicalHost.replace(/\/$/, "")}/sitemap.xml`, host: settings.canonicalHost }; }
