import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";
import { getPublicSiteSettings } from "@/domain/settings/public-settings-service";
import { readMediaObject } from "@/lib/storage/media-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const fallbackIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#153f37"/><text x="32" y="41" text-anchor="middle" font-family="Georgia,serif" font-size="29" font-weight="700" fill="#fff">CZ</text></svg>`;

export async function GET() {
  const settings = await getPublicSiteSettings();
  if (settings.faviconAssetId) {
    const [asset] = await getDb().select({ storageKey: mediaAssets.storageKey, mimeType: mediaAssets.mimeType }).from(mediaAssets).where(and(eq(mediaAssets.id, settings.faviconAssetId), isNull(mediaAssets.deletedAt))).limit(1);
    if (asset) {
      try {
        const bytes = await readMediaObject(asset.storageKey);
        return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": asset.mimeType, "Cache-Control": "public, max-age=3600" } });
      } catch (error) {
        console.error("Favicon read failed", error);
      }
    }
  }
  return new NextResponse(fallbackIcon, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
