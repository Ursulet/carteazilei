import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { bookEditions } from "./catalog";
import {
  commercialPartnerTypeValues,
  commercialPlacementValues,
  softDelete,
  timestamps,
  uuidPrimaryKey,
} from "./common";
import { mediaAssets } from "./media";

export const retailers = pgTable(
  "retailers",
  {
    id: uuidPrimaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    partnerType: text("partner_type", { enum: commercialPartnerTypeValues })
      .default("bookstore")
      .notNull(),
    logoAssetId: uuid("logo_asset_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    baseUrl: text("base_url").notNull(),
    defaultCta: text("default_cta"),
    affiliate: boolean("affiliate").default(false).notNull(),
    commercialPartner: boolean("commercial_partner").default(false).notNull(),
    affiliateDisclosure: text("affiliate_disclosure"),
    active: boolean("active").default(true).notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    check("retailers_base_url_https", sql`${table.baseUrl} ~ '^https://'`),
    check(
      "retailers_partner_type_valid",
      sql`${table.partnerType} in ('publisher', 'bookstore', 'marketplace', 'distributor')`,
    ),
    index("retailers_active_idx").on(table.active),
    index("retailers_partner_type_idx").on(table.partnerType),
  ],
);

export const bookOffers = pgTable(
  "book_offers",
  {
    id: uuidPrimaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => bookEditions.id, { onDelete: "cascade" }),
    retailerId: uuid("retailer_id")
      .notNull()
      .references(() => retailers.id, { onDelete: "restrict" }),
    purchaseUrl: text("purchase_url").notNull(),
    affiliate: boolean("affiliate").default(false).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    displayOrder: integer("display_order").default(100).notNull(),
    ctaLabel: text("cta_label"),
    commercialPlacement: text("commercial_placement", {
      enum: commercialPlacementValues,
    })
      .default("none")
      .notNull(),
    price: numeric("price", { precision: 12, scale: 2 }),
    currency: text("currency"),
    availability: text("availability"),
    checkedAt: timestamp("checked_at", { withTimezone: true }),
    source: text("source"),
    active: boolean("active").default(true).notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    unique("book_offers_edition_retailer_url_unique").on(
      table.editionId,
      table.retailerId,
      table.purchaseUrl,
    ),
    check("book_offers_purchase_url_https", sql`${table.purchaseUrl} ~ '^https://'`),
    check(
      "book_offers_price_positive",
      sql`${table.price} is null or ${table.price} >= 0`,
    ),
    check(
      "book_offers_currency_format",
      sql`${table.currency} is null or ${table.currency} ~ '^[A-Z]{3}$'`,
    ),
    check(
      "book_offers_price_currency_together",
      sql`${table.price} is null or ${table.currency} is not null`,
    ),
    check(
      "book_offers_availability_valid",
      sql`${table.availability} is null or ${table.availability} in ('in_stock', 'out_of_stock', 'preorder', 'unknown')`,
    ),
    check("book_offers_display_order_positive", sql`${table.displayOrder} >= 0`),
    check(
      "book_offers_commercial_placement_valid",
      sql`${table.commercialPlacement} in ('none', 'promoted', 'commercial_partnership')`,
    ),
    uniqueIndex("book_offers_edition_primary_unique")
      .on(table.editionId)
      .where(sql`${table.isPrimary} and ${table.active} and ${table.deletedAt} is null`),
    index("book_offers_edition_active_idx").on(table.editionId, table.active),
    index("book_offers_retailer_id_idx").on(table.retailerId),
    index("book_offers_display_order_idx").on(table.editionId, table.displayOrder),
  ],
);
