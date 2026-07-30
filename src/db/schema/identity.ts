import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
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
    status: text("status").default("active").notNull(),
    avatarAssetId: uuid("avatar_asset_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    phone: text("phone"),
    internalNotes: text("internal_notes"),
    locale: text("locale").default("ro").notNull(),
    timezone: text("timezone").default("Europe/Bucharest").notNull(),
    suspendedUntil: timestamp("suspended_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdBy: uuid("created_by").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
    mustResetPassword: boolean("must_reset_password").default(false).notNull(),
    invitationTokenHash: text("invitation_token_hash"),
    invitationExpiresAt: timestamp("invitation_expires_at", { withTimezone: true }),
    twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
    sessionVersion: integer("session_version").default(0).notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`),
    check("users_session_version_positive", sql`${table.sessionVersion} >= 0`),
    check(
      "users_status_valid",
      sql`${table.status} in ('invited', 'active', 'suspended', 'disabled', 'archived')`,
    ),
    index("users_active_idx").on(table.active),
    index("users_status_idx").on(table.status),
  ],
);

export const roles = pgTable(
  "roles",
  {
    id: uuidPrimaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    isSystem: boolean("is_system").default(false).notNull(),
    isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
    active: boolean("active").default(true).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps(),
  },
  (table) => [index("roles_active_idx").on(table.active)],
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
