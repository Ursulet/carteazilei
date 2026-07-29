import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { entityTypeValues, timestamps, uuidPrimaryKey } from "./common";
import { mediaAssets } from "./media";

export const seoMetadata = pgTable(
  "seo_metadata",
  {
    id: uuidPrimaryKey(),
    entityType: text("entity_type", { enum: entityTypeValues }).notNull(),
    entityId: uuid("entity_id").notNull(),
    titleOverride: text("title_override"),
    descriptionOverride: text("description_override"),
    canonicalOverride: text("canonical_override"),
    ogAssetId: uuid("og_asset_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    indexable: boolean("indexable").default(false).notNull(),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    unique("seo_metadata_entity_unique").on(table.entityType, table.entityId),
    check(
      "seo_metadata_entity_type_valid",
      sql`${table.entityType} in ('book', 'author', 'editor', 'editorial_list', 'genre', 'theme', 'mood', 'audience', 'daily_feature', 'page')`,
    ),
    check(
      "seo_metadata_canonical_https",
      sql`${table.canonicalOverride} is null or ${table.canonicalOverride} ~ '^https://'`,
    ),
    index("seo_metadata_indexable_idx").on(table.indexable),
  ],
);

