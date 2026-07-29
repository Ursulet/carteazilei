import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";
import { readMediaObject } from "@/lib/storage/media-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) {
    return new NextResponse(null, { status: 404 });
  }

  const [asset] = await getDb()
    .select({
      storageKey: mediaAssets.storageKey,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
    })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)))
    .limit(1);
  if (!asset) return new NextResponse(null, { status: 404 });

  try {
    const bytes = await readMediaObject(asset.storageKey);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(asset.byteSize),
        "Content-Type": asset.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Public media read failed", { assetId: id, error });
    return new NextResponse(null, { status: 502 });
  }
}
