import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { authors, books, mediaAssets } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/service";

import { EditorialServiceError } from "./action-state";
import { optionalStringValue, slugSchema, stringValue, zodFieldErrors } from "./form-data";

const authorInputSchema = z.object({
  name: z.string().trim().min(2, "Numele este obligatoriu.").max(200),
  importKey: z.string().trim().min(2).max(160).optional(),
  slug: slugSchema,
  bio: z.string().trim().max(10_000).optional(),
  portraitAssetId: z.uuid().optional(),
  verifiedFacts: z.string().trim().max(10_000).optional(),
  sourceNotes: z.string().trim().max(10_000).optional(),
  status: z.enum(["draft", "needs_review", "published", "archived"]),
});

export type AuthorInput = z.infer<typeof authorInputSchema>;

export function parseAuthorFormData(formData: FormData) {
  const parsed = authorInputSchema.safeParse({
    name: stringValue(formData, "name"),
    importKey: undefined,
    slug: stringValue(formData, "slug"),
    bio: optionalStringValue(formData, "bio"),
    portraitAssetId: optionalStringValue(formData, "portraitAssetId"),
    verifiedFacts: optionalStringValue(formData, "verifiedFacts"),
    sourceNotes: optionalStringValue(formData, "sourceNotes"),
    status: stringValue(formData, "status"),
  });
  if (!parsed.success) throw new EditorialServiceError("Corectează câmpurile marcate.", zodFieldErrors(parsed.error));
  return parsed.data;
}

export async function getAdminAuthors() {
  return getDb().select({
    id: authors.id,
    name: authors.name,
    importKey: authors.importKey,
    slug: authors.slug,
    status: authors.status,
    updatedAt: authors.updatedAt,
  }).from(authors).where(isNull(authors.deletedAt)).orderBy(desc(authors.updatedAt));
}

export async function getAdminAuthor(id: string) {
  const [row] = await getDb().select().from(authors).where(and(eq(authors.id, id), isNull(authors.deletedAt))).limit(1);
  return row ?? null;
}

export async function getAvailableAuthorPortraits() {
  return getDb()
    .select({ id: mediaAssets.id, altText: mediaAssets.altText })
    .from(mediaAssets)
    .where(and(isNull(mediaAssets.deletedAt), sql`${mediaAssets.mimeType} like 'image/%'`))
    .orderBy(desc(mediaAssets.createdAt));
}

export async function saveAuthor(input: AuthorInput, actorUserId: string, authorId?: string) {
  const db = getDb();
  try {
    return await db.transaction(async (transaction) => {
      const existing = authorId
        ? (await transaction.select({ status: authors.status }).from(authors).where(and(eq(authors.id, authorId), isNull(authors.deletedAt))).limit(1))[0]
        : null;
      if (authorId && !existing) throw new EditorialServiceError("Autorul nu mai există.");

      if (input.portraitAssetId) {
        const [portrait] = await transaction
          .select({ id: mediaAssets.id })
          .from(mediaAssets)
          .where(and(
            eq(mediaAssets.id, input.portraitAssetId),
            isNull(mediaAssets.deletedAt),
            sql`${mediaAssets.mimeType} like 'image/%'`,
          ))
          .limit(1);
        if (!portrait) {
          throw new EditorialServiceError("Imaginea selectată nu mai este disponibilă.", {
            portraitAssetId: ["Alege o imagine validă."],
          });
        }
      }

      const now = new Date();
      const values = {
        name: input.name,
        ...(input.importKey === undefined ? {} : { importKey: input.importKey }),
        slug: input.slug,
        bio: input.bio ?? null,
        portraitAssetId: input.portraitAssetId ?? null,
        verifiedFacts: input.verifiedFacts ?? null,
        sourceNotes: input.sourceNotes ?? null,
        status: input.status,
        publishedAt: input.status === "published" ? now : null,
      };
      const [saved] = authorId
        ? await transaction.update(authors).set(values).where(eq(authors.id, authorId)).returning({ id: authors.id })
        : await transaction.insert(authors).values(values).returning({ id: authors.id });
      if (!saved) throw new EditorialServiceError("Autorul nu a putut fi salvat.");

      const action = !existing
        ? "author.create"
        : existing.status !== "published" && input.status === "published"
          ? "author.publish"
          : existing.status === "published" && input.status !== "published"
            ? "author.unpublish"
            : "author.edit";
      await writeAuditLog({
        actorUserId,
        action,
        entityType: "author",
        entityId: saved.id,
        diff: {
          name: input.name,
          portraitAssetId: input.portraitAssetId ?? null,
          previousStatus: existing?.status ?? null,
          status: input.status,
        },
      }, transaction);
      return saved.id;
    });
  } catch (error) {
    if (error instanceof EditorialServiceError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new EditorialServiceError("Slugul este deja folosit.");
    }
    throw error;
  }
}

export async function assignAuthorImportKey(authorId: string, importKey: string, actorUserId: string) {
  const db = getDb();
  try {
    await db.transaction(async (transaction) => {
      const [author] = await transaction
        .select({ id: authors.id, name: authors.name, importKey: authors.importKey })
        .from(authors)
        .where(and(eq(authors.id, authorId), isNull(authors.deletedAt)))
        .limit(1);
      if (!author) throw new EditorialServiceError("Autorul nu mai există.");
      if (author.importKey && author.importKey !== importKey) {
        throw new EditorialServiceError("Autorul are deja un alt identificator de import.");
      }
      if (author.importKey === importKey) return;

      await transaction
        .update(authors)
        .set({ importKey, updatedAt: new Date() })
        .where(eq(authors.id, authorId));
      await writeAuditLog({
        actorUserId,
        action: "author.import_key.assign",
        entityType: "author",
        entityId: authorId,
        diff: { name: author.name, importKey },
      }, transaction);
    });
  } catch (error) {
    if (error instanceof EditorialServiceError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new EditorialServiceError("Identificatorul de import este deja folosit de alt autor.");
    }
    throw error;
  }
}

export async function deleteAuthor(authorId: string, actorUserId: string) {
  const db = getDb();
  await db.transaction(async (transaction) => {
    const [author] = await transaction.select({ name: authors.name }).from(authors).where(and(eq(authors.id, authorId), isNull(authors.deletedAt))).limit(1);
    if (!author) throw new EditorialServiceError("Autorul nu mai există.");
    const [linkedBook] = await transaction.select({ id: books.id }).from(books).where(and(eq(books.primaryAuthorId, authorId), isNull(books.deletedAt))).limit(1);
    if (linkedBook) throw new EditorialServiceError("Autorul nu poate fi șters cât timp are cărți active. Arhivează-l în schimb.");
    await transaction.update(authors).set({ status: "archived", deletedAt: new Date() }).where(eq(authors.id, authorId));
    await writeAuditLog({ actorUserId, action: "author.delete", entityType: "author", entityId: authorId, diff: { name: author.name } }, transaction);
  });
}
