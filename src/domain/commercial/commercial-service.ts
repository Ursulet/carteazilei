import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { bookEditions, bookOffers, books, mediaAssets, retailers } from "@/db/schema";
import { EditorialServiceError } from "@/domain/editorial/action-state";
import {
  optionalStringValue,
  slugSchema,
  stringValue,
  zodFieldErrors,
} from "@/domain/editorial/form-data";
import { writeAuditLog } from "@/lib/audit/service";

const httpsUrl = z
  .url("Introdu un URL valid.")
  .refine((value) => value.startsWith("https://"), "URL-ul trebuie să folosească HTTPS.");

const partnerSchema = z.object({
  name: z.string().trim().min(2, "Numele este obligatoriu.").max(200),
  slug: slugSchema,
  partnerType: z.enum(["publisher", "bookstore", "marketplace", "distributor"]),
  logoAssetId: z.uuid("Alege un logo valid.").optional(),
  baseUrl: httpsUrl,
  defaultCta: z.string().trim().max(120).optional(),
  affiliateDisclosure: z.string().trim().max(2_000).optional(),
  affiliate: z.boolean(),
  commercialPartner: z.boolean(),
  active: z.boolean(),
});

export type CommercialPartnerInput = z.infer<typeof partnerSchema>;

export function parseCommercialPartnerFormData(formData: FormData) {
  const parsed = partnerSchema.safeParse({
    name: stringValue(formData, "name"),
    slug: stringValue(formData, "slug"),
    partnerType: stringValue(formData, "partnerType"),
    logoAssetId: optionalStringValue(formData, "logoAssetId"),
    baseUrl: stringValue(formData, "baseUrl"),
    defaultCta: optionalStringValue(formData, "defaultCta"),
    affiliateDisclosure: optionalStringValue(formData, "affiliateDisclosure"),
    affiliate: formData.has("affiliate"),
    commercialPartner: formData.has("commercialPartner"),
    active: formData.has("active"),
  });
  if (!parsed.success) {
    throw new EditorialServiceError(
      "Corectează câmpurile marcate.",
      zodFieldErrors(parsed.error),
    );
  }
  return parsed.data;
}

export async function saveCommercialPartner(
  input: CommercialPartnerInput,
  actorUserId: string,
  partnerId?: string,
) {
  const db = getDb();
  try {
    return await db.transaction(async (transaction) => {
      const existing = partnerId
        ? (
            await transaction
              .select({ active: retailers.active })
              .from(retailers)
              .where(and(eq(retailers.id, partnerId), isNull(retailers.deletedAt)))
              .limit(1)
          )[0]
        : null;
      if (partnerId && !existing) {
        throw new EditorialServiceError("Partenerul nu mai există.");
      }
      if (input.logoAssetId) {
        const [logo] = await transaction
          .select({ id: mediaAssets.id })
          .from(mediaAssets)
          .where(and(eq(mediaAssets.id, input.logoAssetId), isNull(mediaAssets.deletedAt)))
          .limit(1);
        if (!logo) throw new EditorialServiceError("Logo-ul selectat nu mai există.");
      }

      const values = {
        name: input.name,
        slug: input.slug,
        partnerType: input.partnerType,
        logoAssetId: input.logoAssetId ?? null,
        baseUrl: input.baseUrl,
        defaultCta: input.defaultCta ?? null,
        affiliateDisclosure: input.affiliateDisclosure ?? null,
        affiliate: input.affiliate,
        commercialPartner: input.commercialPartner,
        active: input.active,
      };
      const [saved] = partnerId
        ? await transaction
            .update(retailers)
            .set(values)
            .where(eq(retailers.id, partnerId))
            .returning({ id: retailers.id })
        : await transaction.insert(retailers).values(values).returning({ id: retailers.id });
      if (!saved) throw new EditorialServiceError("Partenerul nu a putut fi salvat.");

      const action = !existing
        ? "commercial_partner.create"
        : existing.active !== input.active
          ? input.active
            ? "commercial_partner.activate"
            : "commercial_partner.deactivate"
          : "commercial_partner.edit";
      await writeAuditLog(
        {
          actorUserId,
          action,
          entityType: "commercial_partner",
          entityId: saved.id,
          diff: {
            name: input.name,
            partnerType: input.partnerType,
            affiliate: input.affiliate,
            commercialPartner: input.commercialPartner,
            active: input.active,
          },
        },
        transaction,
      );
      return saved.id;
    });
  } catch (error) {
    if (error instanceof EditorialServiceError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new EditorialServiceError("Slugul este deja folosit.", {
        slug: ["Alege un slug unic."],
      });
    }
    throw error;
  }
}

export async function deleteCommercialPartner(partnerId: string, actorUserId: string) {
  const db = getDb();
  await db.transaction(async (transaction) => {
    const [partner] = await transaction
      .select({ name: retailers.name })
      .from(retailers)
      .where(and(eq(retailers.id, partnerId), isNull(retailers.deletedAt)))
      .limit(1);
    if (!partner) throw new EditorialServiceError("Partenerul nu mai există.");
    const [linkedOffer] = await transaction
      .select({ id: bookOffers.id })
      .from(bookOffers)
      .where(
        and(
          eq(bookOffers.retailerId, partnerId),
          eq(bookOffers.active, true),
          isNull(bookOffers.deletedAt),
        ),
      )
      .limit(1);
    if (linkedOffer) {
      throw new EditorialServiceError(
        "Partenerul are oferte active. Dezactivează-l sau elimină mai întâi ofertele.",
      );
    }
    await transaction
      .update(retailers)
      .set({ active: false, deletedAt: new Date() })
      .where(eq(retailers.id, partnerId));
    await writeAuditLog(
      {
        actorUserId,
        action: "commercial_partner.delete",
        entityType: "commercial_partner",
        entityId: partnerId,
        diff: { name: partner.name },
      },
      transaction,
    );
  });
}

const offerSchema = z.object({
  retailerId: z.uuid("Alege un partener."),
  purchaseUrl: httpsUrl,
  price: z
    .string()
    .trim()
    .regex(/^\d+(?:[.,]\d{1,2})?$/, "Prețul trebuie să aibă maximum două zecimale.")
    .optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  availability: z.enum(["in_stock", "out_of_stock", "preorder", "unknown"]),
  affiliateMode: z.enum(["inherit", "yes", "no"]),
  isPrimary: z.boolean(),
  displayOrder: z.number().int().min(0).max(100_000),
  ctaLabel: z.string().trim().max(120).optional(),
  commercialPlacement: z.enum(["none", "promoted", "commercial_partnership"]),
  active: z.boolean(),
});

export type BookOfferInput = z.infer<typeof offerSchema>;

export function parseBookOfferFormData(formData: FormData) {
  const rawPrice = optionalStringValue(formData, "price");
  const parsed = offerSchema.safeParse({
    retailerId: stringValue(formData, "retailerId"),
    purchaseUrl: stringValue(formData, "purchaseUrl"),
    price: rawPrice,
    currency: stringValue(formData, "currency") || "RON",
    availability: stringValue(formData, "availability") || "unknown",
    affiliateMode: stringValue(formData, "affiliateMode") || "inherit",
    isPrimary: formData.has("isPrimary"),
    displayOrder: Number(stringValue(formData, "displayOrder") || "100"),
    ctaLabel: optionalStringValue(formData, "ctaLabel"),
    commercialPlacement: stringValue(formData, "commercialPlacement") || "none",
    active: formData.has("active"),
  });
  if (!parsed.success) {
    throw new EditorialServiceError(
      "Corectează câmpurile marcate.",
      zodFieldErrors(parsed.error),
    );
  }
  return parsed.data;
}

export async function saveBookOffer(
  bookId: string,
  input: BookOfferInput,
  actorUserId: string,
  offerId?: string,
) {
  const db = getDb();
  try {
    return await db.transaction(async (transaction) => {
      const [[book], [edition], [partner]] = await Promise.all([
        transaction
          .select({ id: books.id })
          .from(books)
          .where(and(eq(books.id, bookId), isNull(books.deletedAt)))
          .limit(1),
        transaction
          .select({ id: bookEditions.id })
          .from(bookEditions)
          .where(
            and(
              eq(bookEditions.bookId, bookId),
              eq(bookEditions.active, true),
              isNull(bookEditions.deletedAt),
            ),
          )
          .orderBy(desc(bookEditions.updatedAt))
          .limit(1),
        transaction
          .select({ id: retailers.id, affiliate: retailers.affiliate })
          .from(retailers)
          .where(
            and(
              eq(retailers.id, input.retailerId),
              eq(retailers.active, true),
              isNull(retailers.deletedAt),
            ),
          )
          .limit(1),
      ]);
      if (!book) throw new EditorialServiceError("Cartea nu mai există.");
      if (!edition) {
        throw new EditorialServiceError(
          "Cartea are nevoie de o ediție activă înainte de a primi oferte.",
        );
      }
      if (!partner) throw new EditorialServiceError("Partenerul nu mai este activ.");

      const existing = offerId
        ? (
            await transaction
              .select({ id: bookOffers.id, editionId: bookOffers.editionId })
              .from(bookOffers)
              .where(and(eq(bookOffers.id, offerId), isNull(bookOffers.deletedAt)))
              .limit(1)
          )[0]
        : null;
      if (offerId && (!existing || existing.editionId !== edition.id)) {
        throw new EditorialServiceError("Oferta nu mai există pentru această carte.");
      }

      if (input.isPrimary && input.active) {
        await transaction
          .update(bookOffers)
          .set({ isPrimary: false })
          .where(and(eq(bookOffers.editionId, edition.id), isNull(bookOffers.deletedAt)));
      }

      const affiliate =
        input.affiliateMode === "inherit"
          ? partner.affiliate
          : input.affiliateMode === "yes";
      const values = {
        editionId: edition.id,
        retailerId: input.retailerId,
        purchaseUrl: input.purchaseUrl,
        price: input.price?.replace(",", ".") ?? null,
        currency: input.price ? input.currency : null,
        availability: input.availability,
        affiliate,
        isPrimary: input.isPrimary && input.active,
        displayOrder: input.displayOrder,
        ctaLabel: input.ctaLabel ?? null,
        commercialPlacement: input.commercialPlacement,
        checkedAt: input.price ? new Date() : null,
        source: "admin",
        active: input.active,
      };
      const [saved] = offerId
        ? await transaction
            .update(bookOffers)
            .set(values)
            .where(eq(bookOffers.id, offerId))
            .returning({ id: bookOffers.id })
        : await transaction.insert(bookOffers).values(values).returning({ id: bookOffers.id });
      if (!saved) throw new EditorialServiceError("Oferta nu a putut fi salvată.");

      await writeAuditLog(
        {
          actorUserId,
          action: existing ? "book_offer.edit" : "book_offer.create",
          entityType: "book_offer",
          entityId: saved.id,
          diff: {
            bookId,
            partnerId: input.retailerId,
            price: input.price ?? null,
            currency: input.price ? input.currency : null,
            affiliate,
            isPrimary: values.isPrimary,
            commercialPlacement: input.commercialPlacement,
            active: input.active,
          },
        },
        transaction,
      );
      return saved.id;
    });
  } catch (error) {
    if (error instanceof EditorialServiceError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new EditorialServiceError(
        "Aceeași adresă de ofertă este deja asociată partenerului pentru această ediție.",
      );
    }
    throw error;
  }
}

export async function deleteBookOffer(
  bookId: string,
  offerId: string,
  actorUserId: string,
) {
  const db = getDb();
  await db.transaction(async (transaction) => {
    const [offer] = await transaction
      .select({ id: bookOffers.id, editionId: bookOffers.editionId })
      .from(bookOffers)
      .innerJoin(bookEditions, eq(bookEditions.id, bookOffers.editionId))
      .where(
        and(
          eq(bookOffers.id, offerId),
          eq(bookEditions.bookId, bookId),
          isNull(bookOffers.deletedAt),
        ),
      )
      .limit(1);
    if (!offer) throw new EditorialServiceError("Oferta nu mai există.");
    await transaction
      .update(bookOffers)
      .set({ active: false, isPrimary: false, deletedAt: new Date() })
      .where(eq(bookOffers.id, offerId));
    await writeAuditLog(
      {
        actorUserId,
        action: "book_offer.delete",
        entityType: "book_offer",
        entityId: offerId,
        diff: { bookId },
      },
      transaction,
    );
  });
}
