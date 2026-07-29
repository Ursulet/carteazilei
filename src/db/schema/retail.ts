import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { bookEditions } from "./catalog";
import { softDelete, timestamps, uuidPrimaryKey } from "./common";

export const retailers = pgTable(
  "retailers",
  {
    id: uuidPrimaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    baseUrl: text("base_url").notNull(),
    affiliateDisclosure: text("affiliate_disclosure"),
    active: boolean("active").default(true).notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    check("retailers_base_url_https", sql`${table.baseUrl} ~ '^https://'`),
    index("retailers_active_idx").on(table.active),
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
      "book_offers_availability_valid",
      sql`${table.availability} is null or ${table.availability} in ('in_stock', 'out_of_stock', 'preorder', 'unknown')`,
    ),
    index("book_offers_edition_active_idx").on(table.editionId, table.active),
    index("book_offers_retailer_id_idx").on(table.retailerId),
  ],
);

