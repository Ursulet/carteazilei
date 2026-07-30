import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { ensureEditorForUser } from "@/db/queries/admin-editorial";
import { bookEditions, bookOffers, books, dailyFeatures, editors, retailers } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/service";

import { EditorialServiceError } from "./action-state";
import { assertEditorialDate } from "./bucharest-date";
import { linesValue, optionalStringValue, stringValue, zodFieldErrors } from "./form-data";

const dailyInputSchema = z.object({
  featureDate: z.string().refine(assertEditorialDate, "Alege o dată validă."),
  bookId: z.uuid("Alege o carte."),
  editorId: z.uuid().optional(),
  primaryOfferId: z.uuid().optional(),
  headline: z.string().trim().max(300).optional(),
  whyToday: z.string().trim().max(5_000).optional(),
  audienceNote: z.string().trim().max(2_000).optional(),
  fitPoints: z.array(z.string().trim().min(1).max(500)).max(5),
  caveat: z.string().trim().max(2_000).optional(),
  status: z.enum(["draft", "scheduled", "published", "archived"]),
});
export type DailyFeatureInput = z.infer<typeof dailyInputSchema>;

export function parseDailyFeatureFormData(formData: FormData) {
  const parsed = dailyInputSchema.safeParse({
    featureDate: stringValue(formData, "featureDate"),
    bookId: stringValue(formData, "bookId"),
    editorId: optionalStringValue(formData, "editorId"),
    primaryOfferId: optionalStringValue(formData, "primaryOfferId"),
    headline: optionalStringValue(formData, "headline"),
    whyToday: optionalStringValue(formData, "whyToday"),
    audienceNote: optionalStringValue(formData, "audienceNote"),
    fitPoints: linesValue(formData, "fitPoints"),
    caveat: optionalStringValue(formData, "caveat"),
    status: stringValue(formData, "status"),
  });
  if (!parsed.success) throw new EditorialServiceError("Corectează câmpurile marcate.", zodFieldErrors(parsed.error));
  return parsed.data;
}

export async function saveDailyFeature(input: DailyFeatureInput, actorUserId: string, id?: string) {
  const db = getDb();
  const actorEditor = await ensureEditorForUser(db, actorUserId);
  const editorId = input.editorId ?? actorEditor.id;
  const [[book], [editor]] = await Promise.all([
    db.select({ id: books.id, status: books.status }).from(books).where(and(eq(books.id, input.bookId), isNull(books.deletedAt))).limit(1),
    db.select({ id: editors.id }).from(editors).where(and(eq(editors.id, editorId), isNull(editors.deletedAt))).limit(1),
  ]);
  if (!book) throw new EditorialServiceError("Cartea selectată nu mai este disponibilă.");
  if (!editor) throw new EditorialServiceError("Editorul selectat nu mai este disponibil.");
  if (input.primaryOfferId) {
    const [offer] = await db
      .select({ bookId: bookEditions.bookId })
      .from(bookOffers)
      .innerJoin(bookEditions, eq(bookEditions.id, bookOffers.editionId))
      .innerJoin(retailers, eq(retailers.id, bookOffers.retailerId))
      .where(and(
        eq(bookOffers.id, input.primaryOfferId),
        eq(bookOffers.active, true),
        isNull(bookOffers.deletedAt),
        eq(bookEditions.active, true),
        isNull(bookEditions.deletedAt),
        eq(retailers.active, true),
        isNull(retailers.deletedAt),
      ))
      .limit(1);
    if (!offer || offer.bookId !== input.bookId) {
      throw new EditorialServiceError(
        "Oferta principală trebuie să fie activă și să aparțină cărții selectate.",
        { primaryOfferId: ["Alege o ofertă a cărții selectate."] },
      );
    }
  }
  const willBePublic = input.status === "scheduled" || input.status === "published";
  if (
    willBePublic &&
    (!input.headline || !input.whyToday || !input.audienceNote || !input.caveat || input.fitPoints.length < 3)
  ) {
    throw new EditorialServiceError(
      "Selecția nu poate fi programată sau publicată încă. Completează titlul editorial, motivul zilei, audiența, rezerva și minimum trei puncte de potrivire.",
    );
  }
  if (willBePublic && book.status !== "published") {
    throw new EditorialServiceError("Cartea trebuie publicată înainte ca selecția zilnică să poată fi programată sau publicată.");
  }

  try {
    return await db.transaction(async (transaction) => {
      const existing = id
        ? (await transaction.select({ status: dailyFeatures.status, primaryOfferId: dailyFeatures.primaryOfferId }).from(dailyFeatures).where(and(eq(dailyFeatures.id, id), isNull(dailyFeatures.deletedAt))).limit(1))[0]
        : null;
      if (id && !existing) throw new EditorialServiceError("Selecția nu mai există.");
      const now = new Date();
      const values = {
        featureDate: input.featureDate,
        bookId: input.bookId,
        editorId,
        primaryOfferId: input.primaryOfferId ?? null,
        headline: input.headline ?? null,
        whyToday: input.whyToday ?? null,
        audienceNote: input.audienceNote ?? null,
        fitPoints: input.fitPoints,
        caveat: input.caveat ?? null,
        status: input.status,
        scheduledAt: input.status === "scheduled" ? now : null,
        publishedAt: input.status === "published" ? now : null,
      };
      const [saved] = id
        ? await transaction.update(dailyFeatures).set(values).where(eq(dailyFeatures.id, id)).returning({ id: dailyFeatures.id })
        : await transaction.insert(dailyFeatures).values(values).returning({ id: dailyFeatures.id });
      if (!saved) throw new EditorialServiceError("Selecția nu a putut fi salvată.");
      const action = !existing ? "daily_feature.create" : existing.status !== "published" && input.status === "published" ? "daily_feature.publish" : existing.status === "published" && input.status !== "published" ? "daily_feature.unpublish" : "daily_feature.edit";
      await writeAuditLog({ actorUserId, action, entityType: "daily_feature", entityId: saved.id, diff: { featureDate: input.featureDate, previousStatus: existing?.status ?? null, status: input.status, previousPrimaryOfferId: existing?.primaryOfferId ?? null, primaryOfferId: input.primaryOfferId ?? null } }, transaction);
      return saved.id;
    });
  } catch (error) {
    if (error instanceof EditorialServiceError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") throw new EditorialServiceError("Există deja o selecție pentru această dată. O zi poate avea o singură Carte a Zilei.", { featureDate: ["Alege o altă dată sau editează selecția existentă."] });
    throw error;
  }
}

export async function deleteDailyFeature(id: string, actorUserId: string) {
  const db = getDb();
  await db.transaction(async (transaction) => {
    const [row] = await transaction.select({ featureDate: dailyFeatures.featureDate, status: dailyFeatures.status }).from(dailyFeatures).where(and(eq(dailyFeatures.id, id), isNull(dailyFeatures.deletedAt))).limit(1);
    if (!row) throw new EditorialServiceError("Selecția nu mai există.");
    await transaction.update(dailyFeatures).set({ status: "archived", deletedAt: new Date() }).where(eq(dailyFeatures.id, id));
    await writeAuditLog({ actorUserId, action: "daily_feature.delete", entityType: "daily_feature", entityId: id, diff: row }, transaction);
  });
}
