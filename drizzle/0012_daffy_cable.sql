CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"cookie_banner_enabled" boolean DEFAULT true NOT NULL,
	"analytics_enabled" boolean DEFAULT true NOT NULL,
	"cookie_title" text NOT NULL,
	"cookie_description" text NOT NULL,
	"privacy_controller_name" text NOT NULL,
	"privacy_contact_email" text,
	"privacy_contact_address" text,
	"privacy_retention_text" text NOT NULL,
	"privacy_additional_text" text,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;