import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { authors, bookEditions, editors, mediaAssets, retailers, siteSettings, staticPages } from "@/db/schema";
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
  title: z.string().trim().max(200).optional(),
  altText: z.string().trim().min(5, "Descrierea alternativă este obligatorie.").max(500),
  attribution: z.string().trim().max(500).optional(),
  source: z.string().trim().max(300).optional(),
  sourceUrl: z.url("URL-ul sursei nu este valid.").optional(),
});

export async function uploadMedia(formData: FormData, actorUserId: string) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new EditorialServiceError("Alege o imagine pentru încărcare.", { file: ["Fișierul este obligatoriu."] });
  if (file.size > MAX_IMAGE_BYTES) throw new EditorialServiceError("Imaginea depășește limita de 5 MB.", { file: ["Dimensiunea maximă este 5 MB."] });

  const parsed = mediaFieldsSchema.safeParse({
    altText: stringValue(formData, "altText"),
    title: optionalStringValue(formData, "title"),
    attribution: optionalStringValue(formData, "attribution"),
    source: optionalStringValue(formData, "source"),
    sourceUrl: optionalStringValue(formData, "sourceUrl"),
  });
  if (!parsed.success) throw new EditorialServiceError("Corectează metadatele imaginii.", zodFieldErrors(parsed.error));

  const bytes = new Uint8Array(await file.arrayBuffer());
  let metadata: { format?: string; width?: number; height?: number };
  try {
    const { inspectImage } = await import("@/lib/media/image-inspection");
    metadata = await inspectImage(bytes);
  } catch (error) {
    console.error("Image inspection failed", error);
    if (error instanceof Error && error.name === "ImageInspectionUnavailableError") {
      throw new EditorialServiceError("Procesarea imaginilor nu este disponibilă momentan. Verifică dependențele containerului.");
    }
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
        title: parsed.data.title ?? parsed.data.altText,
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

const mediaMetadataSchema = z.object({ title: z.string().trim().min(2).max(200), altText: z.string().trim().min(5).max(500), attribution: z.string().trim().max(500).optional(), source: z.string().trim().max(300).optional(), sourceUrl: z.url().optional(), status: z.enum(["active", "archived"]) });
export function parseMediaMetadataFormData(formData: FormData) { const parsed = mediaMetadataSchema.safeParse({ title: stringValue(formData, "title"), altText: stringValue(formData, "altText"), attribution: optionalStringValue(formData, "attribution"), source: optionalStringValue(formData, "source"), sourceUrl: optionalStringValue(formData, "sourceUrl"), status: stringValue(formData, "status") }); if (!parsed.success) throw new EditorialServiceError("Corectează metadatele imaginii.", zodFieldErrors(parsed.error)); return parsed.data; }
export async function updateMediaMetadata(assetId: string, input: z.infer<typeof mediaMetadataSchema>, actorUserId: string) { const db = getDb(); const [asset] = await db.update(mediaAssets).set({ ...input, attribution: input.attribution ?? null, source: input.source ?? null, sourceUrl: input.sourceUrl ?? null, updatedAt: new Date() }).where(and(eq(mediaAssets.id, assetId), isNull(mediaAssets.deletedAt))).returning({ id: mediaAssets.id }); if (!asset) throw new EditorialServiceError("Imaginea nu mai există."); await writeAuditLog({ actorUserId, action: "media.edit", entityType: "media_asset", entityId: assetId, diff: input }); }

export async function getMediaUsage(assetId: string) {
  const db = getDb();
  const [covers, profiles, authorPortraits, partners, settings, pages] = await Promise.all([
    db.select({ id: bookEditions.id }).from(bookEditions).where(and(eq(bookEditions.coverAssetId, assetId), isNull(bookEditions.deletedAt))).limit(20),
    db.select({ id: editors.id }).from(editors).where(and(eq(editors.avatarAssetId, assetId), isNull(editors.deletedAt))).limit(20),
    db.select({ id: authors.id }).from(authors).where(and(eq(authors.portraitAssetId, assetId), isNull(authors.deletedAt))).limit(20),
    db.select({ id: retailers.id }).from(retailers).where(and(eq(retailers.logoAssetId, assetId), isNull(retailers.deletedAt))).limit(20),
    db.select({ key: siteSettings.key }).from(siteSettings).where(sql`${assetId} in (${siteSettings.logoAssetId}, ${siteSettings.darkLogoAssetId}, ${siteSettings.compactLogoAssetId}, ${siteSettings.faviconAssetId}, ${siteSettings.appleTouchIconAssetId}, ${siteSettings.defaultOgAssetId}, ${siteSettings.bookPlaceholderAssetId})`).limit(20),
    db.select({ id: staticPages.id }).from(staticPages).where(and(eq(staticPages.ogImageAssetId, assetId), isNull(staticPages.deletedAt))).limit(20),
  ]);
  return {
    covers: covers.length,
    profiles: profiles.length,
    authorPortraits: authorPortraits.length,
    partners: partners.length,
    settings: settings.length,
    pages: pages.length,
    total: covers.length + profiles.length + authorPortraits.length + partners.length + settings.length + pages.length,
  };
}

export async function deleteMedia(assetId: string, actorUserId: string) {
  const db = getDb();
  const [asset] = await db.select({ storageKey: mediaAssets.storageKey }).from(mediaAssets)
    .where(and(eq(mediaAssets.id, assetId), isNull(mediaAssets.deletedAt))).limit(1);
  if (!asset) throw new EditorialServiceError("Fișierul media nu mai există.");
  const usage = await getMediaUsage(assetId);
  if (usage.total) throw new EditorialServiceError(`Imaginea este folosită în ${usage.total} locuri. Elimină mai întâi toate atribuirile.`);

  await db.transaction(async (transaction) => {
    await transaction.update(mediaAssets).set({ deletedAt: new Date() }).where(eq(mediaAssets.id, assetId));
    await writeAuditLog({ actorUserId, action: "media.delete", entityType: "media_asset", entityId: assetId, metadata: { storageKey: asset.storageKey } }, transaction);
  });
  await deleteMediaObject(asset.storageKey).catch((error) =>
    console.error("Media object cleanup failed", error),
  );
}
