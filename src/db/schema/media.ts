import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text } from "drizzle-orm/pg-core";

import { softDelete, timestamps, uuidPrimaryKey } from "./common";

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuidPrimaryKey(),
    storageKey: text("storage_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    width: integer("width"),
    height: integer("height"),
    altText: text("alt_text").notNull(),
    attribution: text("attribution"),
    source: text("source"),
    sourceUrl: text("source_url"),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    check("media_assets_byte_size_positive", sql`${table.byteSize} > 0`),
    check(
      "media_assets_width_positive",
      sql`${table.width} is null or ${table.width} > 0`,
    ),
    check(
      "media_assets_height_positive",
      sql`${table.height} is null or ${table.height} > 0`,
    ),
    check(
      "media_assets_dimensions_together",
      sql`(${table.width} is null and ${table.height} is null) or (${table.width} is not null and ${table.height} is not null)`,
    ),
    index("media_assets_mime_type_idx").on(table.mimeType),
  ],
);

