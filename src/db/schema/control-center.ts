import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { softDelete, timestamps, uuidPrimaryKey } from "./common";
import { roles, users } from "./identity";
import { mediaAssets } from "./media";

export const permissions = pgTable("permissions", {
  id: uuidPrimaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  group: text("group_name").notNull(),
  dangerous: boolean("dangerous").default(false).notNull(),
  ...timestamps(),
}, (table) => [index("permissions_group_idx").on(table.group)]);

export const rolePermissions = pgTable("role_permissions", {
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  assignedBy: uuid("assigned_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  primaryKey({ columns: [table.roleId, table.permissionId] }),
  index("role_permissions_permission_idx").on(table.permissionId),
]);

export const contactMessages = pgTable("contact_messages", {
  id: uuidPrimaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }).notNull(),
  status: text("status").default("new").notNull(),
  sourcePath: text("source_path").default("/contact").notNull(),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  lastReadAt: timestamp("last_read_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  ...timestamps(),
  ...softDelete(),
}, (table) => [
  check("contact_messages_status_valid", sql`${table.status} in ('new', 'read', 'in_progress', 'waiting', 'resolved', 'spam', 'archived')`),
  check("contact_messages_category_valid", sql`${table.category} in ('general', 'book_recommendation', 'publisher_collaboration', 'commercial', 'technical', 'correction', 'press', 'other')`),
  index("contact_messages_status_created_idx").on(table.status, table.createdAt),
  index("contact_messages_assigned_idx").on(table.assignedTo, table.status),
]);

export const contactMessageEvents = pgTable("contact_message_events", {
  id: uuidPrimaryKey(),
  messageId: uuid("message_id").notNull().references(() => contactMessages.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  body: text("body"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("contact_message_events_type_valid", sql`${table.type} in ('status', 'note', 'reply', 'assignment')`),
  index("contact_message_events_message_created_idx").on(table.messageId, table.createdAt),
]);

export const contactRateLimits = pgTable("contact_rate_limits", {
  keyHash: text("key_hash").primaryKey(),
  attempts: integer("attempts").default(0).notNull(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).defaultNow().notNull(),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const navigationItems = pgTable("navigation_items", {
  id: uuidPrimaryKey(),
  area: text("area").notNull(),
  groupLabel: text("group_label"),
  label: text("label").notNull(),
  href: text("href").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  external: boolean("external").default(false).notNull(),
  openInNewTab: boolean("open_in_new_tab").default(false).notNull(),
  visibleToRoles: text("visible_to_roles").array().default(sql`'{}'::text[]`).notNull(),
  ...timestamps(),
  ...softDelete(),
}, (table) => [
  check("navigation_items_area_valid", sql`${table.area} in ('header', 'footer')`),
  index("navigation_items_area_order_idx").on(table.area, table.sortOrder),
]);

export const staticPages = pgTable("static_pages", {
  id: uuidPrimaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  status: text("status").default("draft").notNull(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  ogImageAssetId: uuid("og_image_asset_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  authorUserId: uuid("author_user_id").references(() => users.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...timestamps(),
  ...softDelete(),
}, (table) => [
  uniqueIndex("static_pages_slug_unique").on(table.slug),
  check("static_pages_status_valid", sql`${table.status} in ('draft', 'published', 'archived')`),
  index("static_pages_status_idx").on(table.status),
]);

export const whatsappClicks = pgTable("whatsapp_clicks", {
  id: uuidPrimaryKey(),
  sourcePath: text("source_path").notNull(),
  device: text("device").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("whatsapp_clicks_occurred_idx").on(table.occurredAt)]);
