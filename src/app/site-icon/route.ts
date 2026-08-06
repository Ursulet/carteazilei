import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";
import { getPublicSiteSettings } from "@/domain/settings/public-settings-service";
import { readMediaObject } from "@/lib/storage/media-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const fallbackIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#123f35"/><path d="M12.5 17.5c7.7-1.5 14.1.4 19.5 5.4v27.2c-5.4-4.8-11.8-6.6-19.5-5.1V17.5Z" fill="#fffaf1" stroke="#e97832" stroke-linejoin="round" stroke-width="3"/><path d="M51.5 17.5c-7.7-1.5-14.1.4-19.5 5.4v27.2c5.4-4.8 11.8-6.6 19.5-5.1V17.5Z" fill="#fffaf1" stroke="#e97832" stroke-linejoin="round" stroke-width="3"/><path d="M32 23v27" fill="none" stroke="#e97832" stroke-linecap="round" stroke-width="3"/><path d="M18 25c3.3-.1 6.1.7 8.5 2.4M18 32c3.3-.1 6.1.7 8.5 2.4M46 25c-3.3-.1-6.1.7-8.5 2.4M46 32c-3.3-.1-6.1.7-8.5 2.4" fill="none" stroke="#123f35" stroke-linecap="round" stroke-width="2"/></svg>`;

export async function GET() {
  const settings = await getPublicSiteSettings();
  if (settings.faviconAssetId) {
    const [asset] = await getDb().select({ storageKey: mediaAssets.storageKey, mimeType: mediaAssets.mimeType }).from(mediaAssets).where(and(eq(mediaAssets.id, settings.faviconAssetId), isNull(mediaAssets.deletedAt))).limit(1);
    if (asset) {
      try {
        const bytes = await readMediaObject(asset.storageKey);
        return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": asset.mimeType, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
      } catch (error) {
        console.error("Favicon read failed", error);
      }
    }
  }
  return new NextResponse(fallbackIcon, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800", "X-Content-Type-Options": "nosniff" } });
}
