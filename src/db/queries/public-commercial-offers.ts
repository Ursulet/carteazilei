import "server-only";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  bookEditions,
  bookOffers,
  mediaAssets,
  retailers,
} from "@/db/schema";

function resolveCta(partnerName: string, offerCta: string | null, defaultCta: string | null) {
  const cta = offerCta || defaultCta || `Vezi cartea la ${partnerName}`;
  return cta.replaceAll("{partener}", partnerName);
}

export async function listPublicCommercialOffersForBook(
  bookId: string,
  options: { preferredOfferId?: string | null } = {},
  db: Database = getDb(),
) {
  const rows = await db
    .select({
      id: bookOffers.id,
      bookId: bookEditions.bookId,
      partnerId: retailers.id,
      partnerName: retailers.name,
      partnerType: retailers.partnerType,
      logo: {
        id: mediaAssets.id,
        altText: mediaAssets.altText,
        width: mediaAssets.width,
        height: mediaAssets.height,
      },
      affiliate: bookOffers.affiliate,
      affiliateDisclosure: retailers.affiliateDisclosure,
      isBookPrimary: bookOffers.isPrimary,
      displayOrder: bookOffers.displayOrder,
      ctaLabel: bookOffers.ctaLabel,
      defaultCta: retailers.defaultCta,
      commercialPlacement: bookOffers.commercialPlacement,
      price: bookOffers.price,
      currency: bookOffers.currency,
      availability: bookOffers.availability,
      checkedAt: bookOffers.checkedAt,
    })
    .from(bookOffers)
    .innerJoin(bookEditions, eq(bookEditions.id, bookOffers.editionId))
    .innerJoin(retailers, eq(retailers.id, bookOffers.retailerId))
    .leftJoin(mediaAssets, and(eq(mediaAssets.id, retailers.logoAssetId), isNull(mediaAssets.deletedAt)))
    .where(
      and(
        eq(bookEditions.bookId, bookId),
        eq(bookEditions.active, true),
        isNull(bookEditions.deletedAt),
        sql`${bookEditions.id} = (
          select selected_edition.id from book_editions selected_edition
          where selected_edition.book_id = ${bookId}
            and selected_edition.active
            and selected_edition.deleted_at is null
          order by selected_edition.updated_at desc
          limit 1
        )`,
        eq(bookOffers.active, true),
        isNull(bookOffers.deletedAt),
        eq(retailers.active, true),
        isNull(retailers.deletedAt),
      ),
    )
    .orderBy(desc(bookOffers.isPrimary), asc(bookOffers.displayOrder), asc(retailers.name));

  return rows
    .map((row) => ({
      ...row,
      isPrimary: row.id === options.preferredOfferId || row.isBookPrimary,
      isDailyPreferred: row.id === options.preferredOfferId,
      cta: resolveCta(row.partnerName, row.ctaLabel, row.defaultCta),
    }))
    .sort((left, right) => {
      if (left.isDailyPreferred !== right.isDailyPreferred) return left.isDailyPreferred ? -1 : 1;
      if (left.isBookPrimary !== right.isBookPrimary) return left.isBookPrimary ? -1 : 1;
      if (left.displayOrder !== right.displayOrder) return left.displayOrder - right.displayOrder;
      return left.partnerName.localeCompare(right.partnerName, "ro");
    });
}

/**
 * Contract pentru faza de recomandări: se apelează numai după ce rezultatul și
 * cartea au fost stabilite. Modulul comercial nu este importat de scoring.
 */
export async function listOffersForResolvedRecommendation(
  bookId: string,
  db: Database = getDb(),
) {
  return listPublicCommercialOffersForBook(bookId, {}, db);
}

export type PublicCommercialOffer = Awaited<
  ReturnType<typeof listPublicCommercialOffersForBook>
>[number];
