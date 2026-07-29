import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { and, desc, eq, isNull } from "drizzle-orm";
import type { Metadata } from "sharp";
import { z } from "zod";

import { getDb } from "@/db";
import { bookEditions, mediaAssets } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/service";
import { deleteMediaObject, putMediaObject } from "@/lib/storage/media-storage";

import { EditorialServiceError } from "./action-state";
import { optionalStringValue, stringValue, zodFieldErrors } from "./form-data";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const supportedImages = {
  jpeg: { mime: "image/jpeg", extension: "jpg" },
  png: { mime: "image/png", extension: "png" },
  webp: { mime: "image/webp", extension: "webp" },
  avif: { mime: "image/avif", extension: "avif" },
} as const;

const mediaFieldsSchema = z.object({
  altText: z.string().trim().min(5, "Descrierea alternativă este obligatorie.").max(500),
  attribution: z.string().trim().max(500).optional(),
  source: z.string().trim().max(300).optional(),
  sourceUrl: z.url("URL-ul sursei nu este valid.").optional(),
});

export async function getAdminMedia() {
  return getDb().select().from(mediaAssets).where(isNull(mediaAssets.deletedAt)).orderBy(desc(mediaAssets.createdAt));
}

export async function uploadMedia(formData: FormData, actorUserId: string) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new EditorialServiceError("Alege o imagine pentru încărcare.", { file: ["Fișierul este obligatoriu."] });
  if (file.size > MAX_IMAGE_BYTES) throw new EditorialServiceError("Imaginea depășește limita de 5 MB.", { file: ["Dimensiunea maximă este 5 MB."] });

  const parsed = mediaFieldsSchema.safeParse({
    altText: stringValue(formData, "altText"),
    attribution: optionalStringValue(formData, "attribution"),
    source: optionalStringValue(formData, "source"),
    sourceUrl: optionalStringValue(formData, "sourceUrl"),
  });
  if (!parsed.success) throw new EditorialServiceError("Corectează metadatele imaginii.", zodFieldErrors(parsed.error));

  const bytes = new Uint8Array(await file.arrayBuffer());
  let metadata: Metadata;
  try {
    const { default: sharp } = await import("sharp");
    metadata = await sharp(bytes, { failOn: "warning", limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new EditorialServiceError("Fișierul nu este o imagine validă sau este deteriorat.", { file: ["Încarcă JPEG, PNG, WebP sau AVIF."] });
  }
  const format = metadata.format as keyof typeof supportedImages | undefined;
  const accepted = format ? supportedImages[format] : undefined;
  if (!accepted || file.type !== accepted.mime) throw new EditorialServiceError("Tipul declarat al fișierului nu corespunde imaginii.", { file: ["Sunt acceptate JPEG, PNG, WebP și AVIF."] });
  if (!metadata.width || !metadata.height) throw new EditorialServiceError("Dimensiunile imaginii nu au putut fi citite.");

  const hash = createHash("sha256").update(bytes).digest();
  const key = `media/${new Date().getUTCFullYear()}/${randomUUID()}.${accepted.extension}`;
  try {
    await putMediaObject({ key, body: bytes, contentType: accepted.mime, checksumSha256Base64: hash.toString("base64") });
  } catch (error) {
    console.error(error);
    throw new EditorialServiceError("Imaginea nu a putut fi salvată. Verifică volumul persistent și configurarea stocării media.");
  }

  const db = getDb();
  try {
    return await db.transaction(async (transaction) => {
      const [asset] = await transaction.insert(mediaAssets).values({
        storageKey: key,
        mimeType: accepted.mime,
        byteSize: file.size,
        width: metadata.width,
        height: metadata.height,
        altText: parsed.data.altText,
        attribution: parsed.data.attribution ?? null,
        source: parsed.data.source ?? null,
        sourceUrl: parsed.data.sourceUrl ?? null,
      }).returning({ id: mediaAssets.id });
      if (!asset) throw new Error("Metadatele media nu au putut fi salvate.");
      await writeAuditLog({ actorUserId, action: "media.create", entityType: "media_asset", entityId: asset.id, metadata: { storageKey: key, mimeType: accepted.mime, byteSize: file.size, width: metadata.width, height: metadata.height, sha256: hash.toString("hex") } }, transaction);
      return asset.id;
    });
  } catch (error) {
    await deleteMediaObject(key).catch((cleanupError) => console.error("Media cleanup failed", cleanupError));
    throw error;
  }
}

export async function deleteMedia(assetId: string, actorUserId: string) {
  const db = getDb();
  const [asset] = await db.select({ storageKey: mediaAssets.storageKey }).from(mediaAssets)
    .where(and(eq(mediaAssets.id, assetId), isNull(mediaAssets.deletedAt))).limit(1);
  if (!asset) throw new EditorialServiceError("Fișierul media nu mai există.");
  const [usage] = await db.select({ id: bookEditions.id }).from(bookEditions)
    .where(and(eq(bookEditions.coverAssetId, assetId), isNull(bookEditions.deletedAt))).limit(1);
  if (usage) throw new EditorialServiceError("Imaginea este folosită ca copertă. Schimbă mai întâi coperta cărții.");

  await db.transaction(async (transaction) => {
    await transaction.update(mediaAssets).set({ deletedAt: new Date() }).where(eq(mediaAssets.id, assetId));
    await writeAuditLog({ actorUserId, action: "media.delete", entityType: "media_asset", entityId: assetId, metadata: { storageKey: asset.storageKey } }, transaction);
  });
  await deleteMediaObject(asset.storageKey).catch((error) =>
    console.error("Media object cleanup failed", error),
  );
}
