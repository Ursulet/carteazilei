import "server-only";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { getDb, type Database } from "@/db";
import {
  bookEditions,
  bookOffers,
  books,
  commercialClickEvents,
  commercialImpressionEvents,
  mediaAssets,
  retailers,
} from "@/db/schema";

export async function getAdminCommercialPartners(db: Database = getDb()) {
  const outerRetailerId = sql.raw('"retailers"."id"');
  return db
    .select({
      id: retailers.id,
      name: retailers.name,
      slug: retailers.slug,
      partnerType: retailers.partnerType,
      affiliate: retailers.affiliate,
      commercialPartner: retailers.commercialPartner,
      active: retailers.active,
      updatedAt: retailers.updatedAt,
      offerCount: sql<number>`(
        select count(*)::int from ${bookOffers}
        where ${bookOffers.retailerId} = ${outerRetailerId}
          and ${bookOffers.deletedAt} is null
      )`,
      clickCount: sql<number>`(
        select count(*)::int from ${commercialClickEvents}
        where ${commercialClickEvents.partnerId} = ${outerRetailerId}
      )`,
    })
    .from(retailers)
    .where(isNull(retailers.deletedAt))
    .orderBy(desc(retailers.active), asc(retailers.name));
}

export async function getAdminCommercialPartner(id: string, db: Database = getDb()) {
  const [row] = await db
    .select()
    .from(retailers)
    .where(and(eq(retailers.id, id), isNull(retailers.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function getCommercialPartnerFormOptions(db: Database = getDb()) {
  const media = await db
    .select({
      id: mediaAssets.id,
      altText: mediaAssets.altText,
      storageKey: mediaAssets.storageKey,
    })
    .from(mediaAssets)
    .where(and(isNull(mediaAssets.deletedAt), sql`${mediaAssets.mimeType} like 'image/%'`))
    .orderBy(desc(mediaAssets.createdAt));
  return { media };
}

export async function getAdminBookCommercial(bookId: string, db: Database = getDb()) {
  const [book] = await db
    .select({ id: books.id, title: books.title, slug: books.slug })
    .from(books)
    .where(and(eq(books.id, bookId), isNull(books.deletedAt)))
    .limit(1);
  if (!book) return null;

  const [edition] = await db
    .select({ id: bookEditions.id, editionLabel: bookEditions.editionLabel })
    .from(bookEditions)
    .where(
      and(
        eq(bookEditions.bookId, bookId),
        eq(bookEditions.active, true),
        isNull(bookEditions.deletedAt),
      ),
    )
    .orderBy(desc(bookEditions.updatedAt))
    .limit(1);

  const partners = await db
    .select({
      id: retailers.id,
      name: retailers.name,
      affiliate: retailers.affiliate,
      defaultCta: retailers.defaultCta,
    })
    .from(retailers)
    .where(and(eq(retailers.active, true), isNull(retailers.deletedAt)))
    .orderBy(asc(retailers.name));

  const offers = edition
    ? await db
        .select({
          id: bookOffers.id,
          retailerId: bookOffers.retailerId,
          partnerName: retailers.name,
          purchaseUrl: bookOffers.purchaseUrl,
          price: bookOffers.price,
          currency: bookOffers.currency,
          availability: bookOffers.availability,
          affiliate: bookOffers.affiliate,
          isPrimary: bookOffers.isPrimary,
          displayOrder: bookOffers.displayOrder,
          ctaLabel: bookOffers.ctaLabel,
          commercialPlacement: bookOffers.commercialPlacement,
          active: bookOffers.active,
          updatedAt: bookOffers.updatedAt,
        })
        .from(bookOffers)
        .innerJoin(retailers, eq(retailers.id, bookOffers.retailerId))
        .where(and(eq(bookOffers.editionId, edition.id), isNull(bookOffers.deletedAt)))
        .orderBy(desc(bookOffers.isPrimary), asc(bookOffers.displayOrder), asc(retailers.name))
    : [];

  return { book, edition: edition ?? null, partners, offers };
}

export async function getAdminBookOffer(
  bookId: string,
  offerId: string,
  db: Database = getDb(),
) {
  const [row] = await db
    .select({
      id: bookOffers.id,
      retailerId: bookOffers.retailerId,
      purchaseUrl: bookOffers.purchaseUrl,
      price: bookOffers.price,
      currency: bookOffers.currency,
      availability: bookOffers.availability,
      affiliate: bookOffers.affiliate,
      isPrimary: bookOffers.isPrimary,
      displayOrder: bookOffers.displayOrder,
      ctaLabel: bookOffers.ctaLabel,
      commercialPlacement: bookOffers.commercialPlacement,
      active: bookOffers.active,
    })
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
  return row ?? null;
}

export async function getCommercialOverview(db: Database = getDb()) {
  const outerOfferId = sql.raw('"book_offers"."id"');
  const [totals, contexts, topPartners, topBooks, topOffers] = await Promise.all([
    db
      .select({
        clicks: sql<number>`count(distinct "commercial_click_events"."id")::int`,
        impressions: sql<number>`count(distinct "commercial_impression_events"."id")::int`,
      })
      .from(retailers)
      .leftJoin(commercialClickEvents, eq(commercialClickEvents.partnerId, retailers.id))
      .leftJoin(
        commercialImpressionEvents,
        eq(commercialImpressionEvents.partnerId, retailers.id),
      ),
    db.execute(sql<{
      source_context: string;
      clicks: number;
      impressions: number;
    }>`
      select contexts.source_context,
        coalesce(clicks.total, 0)::int as clicks,
        coalesce(impressions.total, 0)::int as impressions
      from (values ('book_page'), ('daily_feature'), ('recommendation')) contexts(source_context)
      left join (
        select source_context, count(*) total from commercial_click_events group by source_context
      ) clicks using (source_context)
      left join (
        select source_context, count(*) total from commercial_impression_events group by source_context
      ) impressions using (source_context)
    `),
    db
      .select({
        id: retailers.id,
        name: retailers.name,
        clicks: sql<number>`count("commercial_click_events"."id")::int`,
      })
      .from(retailers)
      .leftJoin(commercialClickEvents, eq(commercialClickEvents.partnerId, retailers.id))
      .where(isNull(retailers.deletedAt))
      .groupBy(retailers.id, retailers.name)
      .orderBy(desc(sql`count("commercial_click_events"."id")`))
      .limit(5),
    db
      .select({
        id: books.id,
        title: books.title,
        clicks: sql<number>`count("commercial_click_events"."id")::int`,
      })
      .from(books)
      .leftJoin(commercialClickEvents, eq(commercialClickEvents.bookId, books.id))
      .where(isNull(books.deletedAt))
      .groupBy(books.id, books.title)
      .orderBy(desc(sql`count("commercial_click_events"."id")`))
      .limit(5),
    db
      .select({
        id: bookOffers.id,
        bookTitle: books.title,
        partnerName: retailers.name,
        clicks: sql<number>`(
          select count(*)::int from ${commercialClickEvents}
          where ${commercialClickEvents.offerId} = ${outerOfferId}
        )`,
        impressions: sql<number>`(
          select count(*)::int from ${commercialImpressionEvents}
          where ${commercialImpressionEvents.offerId} = ${outerOfferId}
        )`,
      })
      .from(bookOffers)
      .innerJoin(bookEditions, eq(bookEditions.id, bookOffers.editionId))
      .innerJoin(books, eq(books.id, bookEditions.bookId))
      .innerJoin(retailers, eq(retailers.id, bookOffers.retailerId))
      .where(and(isNull(bookOffers.deletedAt), isNull(books.deletedAt), isNull(retailers.deletedAt)))
      .orderBy(desc(sql`(
        select count(*) from ${commercialClickEvents}
        where ${commercialClickEvents.offerId} = ${outerOfferId}
      )`), asc(books.title), asc(retailers.name))
      .limit(10),
  ]);

  return {
    totals: totals[0] ?? { clicks: 0, impressions: 0 },
    contexts: contexts.map((row) => ({
      sourceContext: String(row.source_context),
      clicks: Number(row.clicks),
      impressions: Number(row.impressions),
    })),
    topPartners,
    topBooks,
    topOffers,
  };
}
