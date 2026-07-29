import "server-only";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { editors, mediaAssets, users } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/service";

import { EditorialServiceError } from "./action-state";
import { linesValue, optionalStringValue, slugSchema, stringValue, zodFieldErrors } from "./form-data";

const editorProfileInputSchema = z.object({
  displayName: z.string().trim().min(2, "Numele public este obligatoriu.").max(160),
  slug: slugSchema,
  bio: z.string().trim().max(10_000).optional(),
  expertise: z.array(z.string().trim().min(1).max(120)).max(20),
  avatarAssetId: z.uuid().optional(),
  publicProfile: z.boolean(),
}).superRefine((value, context) => {
  if (value.publicProfile && !value.bio) {
    context.addIssue({ code: "custom", path: ["bio"], message: "Biografia este obligatorie pentru un profil public." });
  }
});

export function parseEditorProfileFormData(formData: FormData) {
  const parsed = editorProfileInputSchema.safeParse({
    displayName: stringValue(formData, "displayName"),
    slug: stringValue(formData, "slug"),
    bio: optionalStringValue(formData, "bio"),
    expertise: linesValue(formData, "expertise"),
    avatarAssetId: optionalStringValue(formData, "avatarAssetId"),
    publicProfile: formData.get("publicProfile") === "on",
  });
  if (!parsed.success) throw new EditorialServiceError("Corectează câmpurile marcate.", zodFieldErrors(parsed.error));
  return parsed.data;
}

export async function getAdminEditorProfiles() {
  return getDb()
    .select({
      id: editors.id,
      displayName: editors.displayName,
      slug: editors.slug,
      publicProfile: editors.publicProfile,
      updatedAt: editors.updatedAt,
      email: users.email,
      roles: sql<string[]>`coalesce((
        select array_agg(r.code order by r.code)
        from user_roles ur join roles r on r.id = ur.role_id
        where ur.user_id = ${users.id}
      ), '{}'::text[])`,
    })
    .from(editors)
    .innerJoin(users, eq(users.id, editors.userId))
    .where(and(isNull(editors.deletedAt), isNull(users.deletedAt)))
    .orderBy(desc(editors.publicProfile), asc(editors.displayName));
}

export async function getAdminInternalUsers() {
  return getDb()
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      active: users.active,
      updatedAt: users.updatedAt,
      editorId: editors.id,
      displayName: editors.displayName,
      slug: editors.slug,
      publicProfile: editors.publicProfile,
      roles: sql<string[]>`coalesce((
        select array_agg(r.code order by r.code)
        from user_roles ur join roles r on r.id = ur.role_id
        where ur.user_id = ${users.id}
      ), '{}'::text[])`,
    })
    .from(users)
    .leftJoin(editors, and(eq(editors.userId, users.id), isNull(editors.deletedAt)))
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.active), asc(users.name));
}

function editorSlug(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return normalized || "editor";
}

export async function createEditorProfileForUser(userId: string, actorUserId: string) {
  const parsedUserId = z.uuid().safeParse(userId);
  if (!parsedUserId.success) throw new EditorialServiceError("Utilizatorul nu este valid.");

  const db = getDb();
  return db.transaction(async (transaction) => {
    const [account] = await transaction
      .select({ id: users.id, name: users.name, active: users.active, editorId: editors.id })
      .from(users)
      .leftJoin(editors, and(eq(editors.userId, users.id), isNull(editors.deletedAt)))
      .where(and(eq(users.id, parsedUserId.data), isNull(users.deletedAt)))
      .limit(1);
    if (!account) throw new EditorialServiceError("Utilizatorul nu mai există.");
    if (!account.active) throw new EditorialServiceError("Profilul nu poate fi creat pentru un cont inactiv.");
    if (account.editorId) return account.editorId;

    const baseSlug = editorSlug(account.name);
    const [slugCollision] = await transaction
      .select({ id: editors.id })
      .from(editors)
      .where(eq(editors.slug, baseSlug))
      .limit(1);
    const slug = slugCollision ? `${baseSlug}-${account.id.slice(0, 6)}` : baseSlug;
    const [profile] = await transaction
      .insert(editors)
      .values({ userId: account.id, displayName: account.name, slug, publicProfile: false })
      .returning({ id: editors.id });
    if (!profile) throw new EditorialServiceError("Profilul editorial nu a putut fi creat.");

    await writeAuditLog({
      actorUserId,
      action: "editor.profile.create",
      entityType: "editor",
      entityId: profile.id,
      diff: { displayName: account.name, slug, userId: account.id },
    }, transaction);
    return profile.id;
  });
}

export async function getAdminEditorProfile(id: string) {
  const db = getDb();
  const [profile, media] = await Promise.all([
    db
      .select({
        id: editors.id,
        displayName: editors.displayName,
        slug: editors.slug,
        bio: editors.bio,
        expertise: editors.expertise,
        avatarAssetId: editors.avatarAssetId,
        publicProfile: editors.publicProfile,
        email: users.email,
      })
      .from(editors)
      .innerJoin(users, eq(users.id, editors.userId))
      .where(and(eq(editors.id, id), isNull(editors.deletedAt), isNull(users.deletedAt)))
      .limit(1),
    db
      .select({ id: mediaAssets.id, altText: mediaAssets.altText })
      .from(mediaAssets)
      .where(and(isNull(mediaAssets.deletedAt), sql`${mediaAssets.mimeType} like 'image/%'`))
      .orderBy(desc(mediaAssets.createdAt)),
  ]);
  return profile[0] ? { profile: profile[0], media } : null;
}

export async function saveEditorProfile(
  id: string,
  input: z.infer<typeof editorProfileInputSchema>,
  actorUserId: string,
) {
  const db = getDb();
  try {
    return await db.transaction(async (transaction) => {
      const [existing] = await transaction
        .select({ slug: editors.slug, publicProfile: editors.publicProfile })
        .from(editors)
        .where(and(eq(editors.id, id), isNull(editors.deletedAt)))
        .limit(1);
      if (!existing) throw new EditorialServiceError("Profilul editorial nu mai există.");

      if (input.avatarAssetId) {
        const [asset] = await transaction
          .select({ id: mediaAssets.id })
          .from(mediaAssets)
          .where(and(eq(mediaAssets.id, input.avatarAssetId), isNull(mediaAssets.deletedAt), sql`${mediaAssets.mimeType} like 'image/%'`))
          .limit(1);
        if (!asset) throw new EditorialServiceError("Imaginea selectată nu mai este disponibilă.", { avatarAssetId: ["Alege o imagine validă."] });
      }

      await transaction.update(editors).set({
        displayName: input.displayName,
        slug: input.slug,
        bio: input.bio ?? null,
        expertise: input.expertise,
        avatarAssetId: input.avatarAssetId ?? null,
        publicProfile: input.publicProfile,
      }).where(eq(editors.id, id));
      await writeAuditLog({
        actorUserId,
        action: "editor.profile.edit",
        entityType: "editor",
        entityId: id,
        diff: {
          previousSlug: existing.slug,
          slug: input.slug,
          previousPublicProfile: existing.publicProfile,
          publicProfile: input.publicProfile,
        },
      }, transaction);
      return { previousSlug: existing.slug, slug: input.slug };
    });
  } catch (error) {
    if (error instanceof EditorialServiceError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new EditorialServiceError("Slugul este deja folosit.", { slug: ["Alege un slug unic."] });
    }
    throw error;
  }
}
