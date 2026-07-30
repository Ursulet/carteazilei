import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./common";
import { users } from "./identity";

export const recommendationConfigurations = pgTable("recommendation_configurations", {
  key: text("key").primaryKey(),
  minimumScore: integer("minimum_score").default(35).notNull(),
  needWeight: integer("need_weight").default(26).notNull(),
  genreWeight: integer("genre_weight").default(16).notNull(),
  paceWeight: integer("pace_weight").default(12).notNull(),
  lengthWeight: integer("length_weight").default(8).notNull(),
  referenceWeight: integer("reference_weight").default(18).notNull(),
  editorialConfidenceWeight: integer("editorial_confidence_weight").default(8).notNull(),
  freshnessWeight: integer("freshness_weight").default(4).notNull(),
  revision: integer("revision").default(1).notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps(),
}, (table) => [
  check("recommendation_config_minimum_score_range", sql`${table.minimumScore} between 0 and 100`),
  check("recommendation_config_need_weight_range", sql`${table.needWeight} between 0 and 100`),
  check("recommendation_config_genre_weight_range", sql`${table.genreWeight} between 0 and 100`),
  check("recommendation_config_pace_weight_range", sql`${table.paceWeight} between 0 and 100`),
  check("recommendation_config_length_weight_range", sql`${table.lengthWeight} between 0 and 100`),
  check("recommendation_config_reference_weight_range", sql`${table.referenceWeight} between 0 and 100`),
  check("recommendation_config_editorial_weight_range", sql`${table.editorialConfidenceWeight} between 0 and 100`),
  check("recommendation_config_freshness_weight_range", sql`${table.freshnessWeight} between 0 and 100`),
  check("recommendation_config_revision_positive", sql`${table.revision} > 0`),
]);
