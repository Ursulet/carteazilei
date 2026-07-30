CREATE TABLE "contact_message_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"type" text NOT NULL,
	"body" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_message_events_type_valid" CHECK ("contact_message_events"."type" in ('status', 'note', 'reply', 'assignment'))
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"subject" text NOT NULL,
	"category" text NOT NULL,
	"message" text NOT NULL,
	"privacy_accepted_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"source_path" text DEFAULT '/contact' NOT NULL,
	"assigned_to" uuid,
	"last_read_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"ip_hash" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "contact_messages_status_valid" CHECK ("contact_messages"."status" in ('new', 'read', 'in_progress', 'waiting', 'resolved', 'spam', 'archived')),
	CONSTRAINT "contact_messages_category_valid" CHECK ("contact_messages"."category" in ('general', 'book_recommendation', 'publisher_collaboration', 'commercial', 'technical', 'correction', 'press', 'other'))
);
--> statement-breakpoint
CREATE TABLE "contact_rate_limits" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"blocked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navigation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area" text NOT NULL,
	"group_label" text,
	"label" text NOT NULL,
	"href" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"external" boolean DEFAULT false NOT NULL,
	"open_in_new_tab" boolean DEFAULT false NOT NULL,
	"visible_to_roles" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "navigation_items_area_valid" CHECK ("navigation_items"."area" in ('header', 'footer'))
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"group_name" text NOT NULL,
	"dangerous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" uuid,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "static_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"og_image_asset_id" uuid,
	"author_user_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "static_pages_status_valid" CHECK ("static_pages"."status" in ('draft', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "whatsapp_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_path" text NOT NULL,
	"device" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_code_valid";--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "outcome" text DEFAULT 'success' NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "is_super_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locale" text DEFAULT 'ro' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timezone" text DEFAULT 'Europe/Bucharest' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suspended_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_reset_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invitation_token_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invitation_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "short_name" text DEFAULT 'Cartea Zilei' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "site_description" text DEFAULT 'Platformă editorială de recomandări de carte.' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "primary_url" text DEFAULT 'https://carteazilei.ro' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "default_language" text DEFAULT 'ro' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "timezone" text DEFAULT 'Europe/Bucharest' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "copyright_text" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "legal_operator_name" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "title_template" text DEFAULT '%s | Cartea Zilei' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "canonical_host" text DEFAULT 'https://carteazilei.ro' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "indexing_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "google_site_verification" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "bing_site_verification" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "dark_logo_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "compact_logo_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "apple_touch_icon_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "default_og_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "book_placeholder_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "primary_color" text DEFAULT '#123f35' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "accent_color" text DEFAULT '#a66f19' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "social_facebook" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "social_instagram" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "social_tiktok" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "social_youtube" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "social_linkedin" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "social_x" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "social_goodreads" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "affiliate_disclosure" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "company_name" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "company_tax_id" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "company_registry_number" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "company_fiscal_address" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "commercial_email" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "partnership_default_text" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "feature_recommendation" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "feature_daily_archive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "feature_newsletter" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "feature_contact_form" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "feature_whatsapp" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "feature_user_reviews" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "feature_public_accounts" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "feature_prices" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "feature_offer_comparison" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "maintenance_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "maintenance_title" text DEFAULT 'Revenim în curând' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "maintenance_message" text DEFAULT 'Lucrăm la îmbunătățirea site-ului.' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "maintenance_estimated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_number" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_message" text DEFAULT 'Bună! Am ajuns de pe CarteaZilei.ro și aș dori mai multe informații.' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_label" text DEFAULT 'Scrie-ne pe WhatsApp' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_position" text DEFAULT 'right' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_show_desktop" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_show_mobile" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_included_paths" text[];--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_excluded_paths" text[];--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_schedule" jsonb;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_online_message" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_offline_message" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_color" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_tracking_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_message_events" ADD CONSTRAINT "contact_message_events_message_id_contact_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_message_events" ADD CONSTRAINT "contact_message_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "static_pages" ADD CONSTRAINT "static_pages_og_image_asset_id_media_assets_id_fk" FOREIGN KEY ("og_image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "static_pages" ADD CONSTRAINT "static_pages_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_message_events_message_created_idx" ON "contact_message_events" USING btree ("message_id","created_at");--> statement-breakpoint
CREATE INDEX "contact_messages_status_created_idx" ON "contact_messages" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "contact_messages_assigned_idx" ON "contact_messages" USING btree ("assigned_to","status");--> statement-breakpoint
CREATE INDEX "navigation_items_area_order_idx" ON "navigation_items" USING btree ("area","sort_order");--> statement-breakpoint
CREATE INDEX "permissions_group_idx" ON "permissions" USING btree ("group_name");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "static_pages_slug_unique" ON "static_pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "static_pages_status_idx" ON "static_pages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "whatsapp_clicks_occurred_idx" ON "whatsapp_clicks" USING btree ("occurred_at");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_asset_id_media_assets_id_fk" FOREIGN KEY ("avatar_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_dark_logo_asset_id_media_assets_id_fk" FOREIGN KEY ("dark_logo_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_compact_logo_asset_id_media_assets_id_fk" FOREIGN KEY ("compact_logo_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_apple_touch_icon_asset_id_media_assets_id_fk" FOREIGN KEY ("apple_touch_icon_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_og_asset_id_media_assets_id_fk" FOREIGN KEY ("default_og_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_book_placeholder_asset_id_media_assets_id_fk" FOREIGN KEY ("book_placeholder_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "roles_active_idx" ON "roles" USING btree ("active");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_status_valid" CHECK ("users"."status" in ('invited', 'active', 'suspended', 'disabled', 'archived'));--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_status_valid" CHECK ("media_assets"."status" in ('active', 'archived'));--> statement-breakpoint
INSERT INTO "permissions" ("code", "name", "description", "group_name", "dangerous") VALUES
('dashboard.view', 'Dashboard', 'Vizualizare sumar operațional', 'Dashboard', false),
('users.view', 'Vizualizare utilizatori', 'Listă, detalii și activitate', 'Utilizatori', false),
('users.create', 'Creare utilizatori', 'Creare și invitare conturi', 'Utilizatori', false),
('users.update', 'Editare utilizatori', 'Date, roluri și status', 'Utilizatori', true),
('users.suspend', 'Suspendare utilizatori', 'Suspendare și revocare sesiuni', 'Utilizatori', true),
('users.delete', 'Arhivare utilizatori', 'Arhivare sau ștergere logică', 'Utilizatori', true),
('roles.view', 'Vizualizare roluri', 'Roluri și matrice permisiuni', 'Acces', false),
('roles.manage', 'Administrare roluri', 'Creare roluri și asignare permisiuni', 'Acces', true),
('permissions.view', 'Vizualizare permisiuni', 'Catalogul permisiunilor', 'Acces', false),
('permissions.manage', 'Administrare permisiuni', 'Modificarea permisiunilor de sistem', 'Acces', true),
('books.view', 'Vizualizare cărți', 'Catalog editorial', 'Conținut', false),
('books.create', 'Creare cărți', 'Adăugare titluri', 'Conținut', false),
('books.update', 'Editare cărți', 'Fișă editorială și ediții', 'Conținut', false),
('books.publish', 'Publicare cărți', 'Schimbarea statusului public', 'Conținut', true),
('books.delete', 'Arhivare cărți', 'Ștergere logică', 'Conținut', true),
('authors.manage', 'Administrare autori', 'Profiluri de autor', 'Conținut', false),
('daily_features.manage', 'Cartea Zilei', 'Planificare și publicare', 'Conținut', false),
('lists.manage', 'Liste editoriale', 'Creare și publicare liste', 'Conținut', false),
('pages.manage', 'Pagini statice', 'Creare și publicare pagini', 'Conținut', false),
('taxonomies.manage', 'Taxonomii', 'Genuri, teme și audiențe', 'Conținut', false),
('relationships.manage', 'Relații între cărți', 'Similaritate și lecturi următoare', 'Conținut', false),
('recommendations.view', 'Vizualizare recomandări', 'Sesiuni, rezultate și feedback', 'Recomandări', false),
('recommendations.configure', 'Configurare recomandări', 'Ponderi și praguri algoritm', 'Recomandări', true),
('partners.manage', 'Administrare parteneri', 'Edituri, librării și marketplace-uri', 'Comercial', false),
('offers.manage', 'Administrare oferte', 'Prețuri și linkuri comerciale', 'Comercial', false),
('commercial.analytics', 'Rapoarte comerciale', 'Clickuri și CTR', 'Comercial', false),
('analytics.view', 'Vizualizare analytics', 'Rapoarte de produs și SEO', 'Analytics', false),
('media.view', 'Vizualizare Media', 'Biblioteca de fișiere', 'Media', false),
('media.manage', 'Administrare Media', 'Încărcare și metadate', 'Media', false),
('media.delete', 'Ștergere Media', 'Arhivarea fișierelor nefolosite', 'Media', true),
('seo.view', 'Vizualizare SEO', 'Stare indexare și performanță SEO', 'Configurare', false),
('seo.manage', 'Administrare SEO', 'Metadate și indexare', 'Configurare', false),
('site_settings.view', 'Vizualizare setări', 'Setările globale ale site-ului', 'Configurare', false),
('site_settings.update', 'Modificare setări', 'Identitate, branding și funcționalități', 'Configurare', true),
('navigation.manage', 'Administrare navigație', 'Header și footer', 'Configurare', false),
('whatsapp.manage', 'Administrare WhatsApp', 'Buton, program și tracking', 'Comunicare', false),
('contact_messages.view', 'Vizualizare mesaje', 'Inbox contact', 'Comunicare', false),
('contact_messages.reply', 'Răspuns mesaje', 'Răspunsuri și note interne', 'Comunicare', false),
('contact_messages.manage', 'Gestionare mesaje', 'Status, atribuire și spam', 'Comunicare', false),
('contact_messages.delete', 'Ștergere mesaje', 'Ștergere conform retenției', 'Comunicare', true),
('audit_logs.view', 'Vizualizare audit', 'Jurnalul operațiunilor sensibile', 'Sistem', true),
('system.view', 'Status sistem', 'Stocare și stare operațională', 'Sistem', false)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "group_name" = EXCLUDED."group_name", "dangerous" = EXCLUDED."dangerous", "updated_at" = now();--> statement-breakpoint
INSERT INTO "roles" ("code", "name", "description", "is_system", "is_super_admin", "active") VALUES
('super_admin', 'Super Admin', 'Control complet asupra platformei și accesului.', true, true, true),
('admin', 'Administrator', 'Administrare operațională fără modificarea accesului critic.', true, false, true),
('editor', 'Editor', 'Catalog, publicare și conținut editorial.', true, false, true),
('commercial_manager', 'Manager comercial', 'Parteneri, oferte și rapoarte comerciale.', true, false, true),
('support', 'Support', 'Mesaje, răspunsuri și relația cu vizitatorii.', true, false, true),
('analyst', 'Analist', 'Acces read-only la rapoarte și performanță.', true, false, true)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "is_system" = true, "is_super_admin" = EXCLUDED."is_super_admin", "active" = true, "updated_at" = now();--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r CROSS JOIN "permissions" p
WHERE r.code = 'super_admin'
   OR (r.code = 'admin' AND p.code NOT IN ('roles.manage', 'permissions.manage', 'system.view'))
   OR (r.code = 'editor' AND p.code IN ('dashboard.view','books.view','books.create','books.update','books.publish','authors.manage','daily_features.manage','lists.manage','pages.manage','taxonomies.manage','relationships.manage','media.view','media.manage','seo.view','seo.manage'))
   OR (r.code = 'commercial_manager' AND p.code IN ('dashboard.view','partners.manage','offers.manage','commercial.analytics','media.view','media.manage'))
   OR (r.code = 'support' AND p.code IN ('dashboard.view','contact_messages.view','contact_messages.reply','contact_messages.manage'))
   OR (r.code = 'analyst' AND p.code IN ('dashboard.view','recommendations.view','commercial.analytics','analytics.view','seo.view'))
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "role_id", "assigned_by")
SELECT ur.user_id, super_role.id, COALESCE(ur.assigned_by, ur.user_id)
FROM "user_roles" AS ur
JOIN "roles" AS source_role ON source_role.id = ur.role_id AND source_role.code = 'admin'
CROSS JOIN "roles" AS super_role
WHERE super_role.code = 'super_admin'
ON CONFLICT DO NOTHING;
