import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { mediaAssets } from "./media";
import {
  roleCodeValues,
  softDelete,
  timestamps,
  uuidPrimaryKey,
} from "./common";

export const users = pgTable(
  "users",
  {
    id: uuidPrimaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    active: boolean("active").default(true).notNull(),
    sessionVersion: integer("session_version").default(0).notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`),
    check("users_session_version_positive", sql`${table.sessionVersion} >= 0`),
    index("users_active_idx").on(table.active),
  ],
);

export const roles = pgTable(
  "roles",
  {
    id: uuidPrimaryKey(),
    code: text("code", { enum: roleCodeValues }).notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    ...timestamps(),
  },
  (table) => [
    check(
      "roles_code_valid",
      sql`${table.code} in ('admin', 'editor', 'analyst')`,
    ),
  ],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    assignedBy: uuid("assigned_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index("user_roles_role_id_idx").on(table.roleId),
  ],
);

export const editors = pgTable(
  "editors",
  {
    id: uuidPrimaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "restrict" }),
    displayName: text("display_name").notNull(),
    slug: text("slug").notNull().unique(),
    bio: text("bio"),
    expertise: text("expertise").array().default(sql`'{}'::text[]`).notNull(),
    avatarAssetId: uuid("avatar_asset_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    publicProfile: boolean("public_profile").default(false).notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    index("editors_public_profile_idx").on(table.publicProfile),
  ],
);
