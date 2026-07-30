CREATE TABLE "recommendation_configurations" (
	"key" text PRIMARY KEY NOT NULL,
	"minimum_score" integer DEFAULT 35 NOT NULL,
	"need_weight" integer DEFAULT 26 NOT NULL,
	"genre_weight" integer DEFAULT 16 NOT NULL,
	"pace_weight" integer DEFAULT 12 NOT NULL,
	"length_weight" integer DEFAULT 8 NOT NULL,
	"reference_weight" integer DEFAULT 18 NOT NULL,
	"editorial_confidence_weight" integer DEFAULT 8 NOT NULL,
	"freshness_weight" integer DEFAULT 4 NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendation_config_minimum_score_range" CHECK ("recommendation_configurations"."minimum_score" between 0 and 100),
	CONSTRAINT "recommendation_config_need_weight_range" CHECK ("recommendation_configurations"."need_weight" between 0 and 100),
	CONSTRAINT "recommendation_config_genre_weight_range" CHECK ("recommendation_configurations"."genre_weight" between 0 and 100),
	CONSTRAINT "recommendation_config_pace_weight_range" CHECK ("recommendation_configurations"."pace_weight" between 0 and 100),
	CONSTRAINT "recommendation_config_length_weight_range" CHECK ("recommendation_configurations"."length_weight" between 0 and 100),
	CONSTRAINT "recommendation_config_reference_weight_range" CHECK ("recommendation_configurations"."reference_weight" between 0 and 100),
	CONSTRAINT "recommendation_config_editorial_weight_range" CHECK ("recommendation_configurations"."editorial_confidence_weight" between 0 and 100),
	CONSTRAINT "recommendation_config_freshness_weight_range" CHECK ("recommendation_configurations"."freshness_weight" between 0 and 100),
	CONSTRAINT "recommendation_config_revision_positive" CHECK ("recommendation_configurations"."revision" > 0)
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "site_name" text DEFAULT 'Cartea Zilei' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "site_tagline" text DEFAULT 'Recomandări explicate. Mai puține titluri. Alegeri mai bune.' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "default_meta_title" text DEFAULT 'Cartea Zilei — Recomandări de cărți explicate' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "default_meta_description" text DEFAULT 'Recomandări editoriale și personalizate care te ajută să alegi următoarea carte bună.' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "logo_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "favicon_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "contact_address" text;--> statement-breakpoint
ALTER TABLE "recommendation_configurations" ADD CONSTRAINT "recommendation_configurations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_asset_id_media_assets_id_fk" FOREIGN KEY ("logo_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_asset_id_media_assets_id_fk" FOREIGN KEY ("favicon_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;