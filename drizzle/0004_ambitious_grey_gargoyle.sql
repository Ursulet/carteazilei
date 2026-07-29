CREATE TABLE "commercial_click_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"offer_id" uuid NOT NULL,
	"source_context" text NOT NULL,
	"source_path" text NOT NULL,
	"daily_feature_id" uuid,
	"recommendation_result_id" uuid,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commercial_click_events_context_valid" CHECK ("commercial_click_events"."source_context" in ('book_page', 'daily_feature', 'recommendation', 'other'))
);
--> statement-breakpoint
CREATE TABLE "commercial_impression_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"offer_id" uuid NOT NULL,
	"source_context" text NOT NULL,
	"source_path" text NOT NULL,
	"daily_feature_id" uuid,
	"recommendation_result_id" uuid,
	"displayed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commercial_impression_events_context_valid" CHECK ("commercial_impression_events"."source_context" in ('book_page', 'daily_feature', 'recommendation', 'other'))
);
--> statement-breakpoint
ALTER TABLE "daily_features" ADD COLUMN "primary_offer_id" uuid;--> statement-breakpoint
ALTER TABLE "book_offers" ADD COLUMN "is_primary" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "book_offers" ADD COLUMN "display_order" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "book_offers" ADD COLUMN "cta_label" text;--> statement-breakpoint
ALTER TABLE "book_offers" ADD COLUMN "commercial_placement" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "retailers" ADD COLUMN "partner_type" text DEFAULT 'bookstore' NOT NULL;--> statement-breakpoint
ALTER TABLE "retailers" ADD COLUMN "logo_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "retailers" ADD COLUMN "default_cta" text;--> statement-breakpoint
ALTER TABLE "retailers" ADD COLUMN "affiliate" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "retailers" ADD COLUMN "commercial_partner" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commercial_click_events" ADD CONSTRAINT "commercial_click_events_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_click_events" ADD CONSTRAINT "commercial_click_events_partner_id_retailers_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."retailers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_click_events" ADD CONSTRAINT "commercial_click_events_offer_id_book_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."book_offers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_click_events" ADD CONSTRAINT "commercial_click_events_daily_feature_id_daily_features_id_fk" FOREIGN KEY ("daily_feature_id") REFERENCES "public"."daily_features"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_click_events" ADD CONSTRAINT "commercial_click_events_recommendation_result_id_recommendation_results_id_fk" FOREIGN KEY ("recommendation_result_id") REFERENCES "public"."recommendation_results"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_impression_events" ADD CONSTRAINT "commercial_impression_events_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_impression_events" ADD CONSTRAINT "commercial_impression_events_partner_id_retailers_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."retailers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_impression_events" ADD CONSTRAINT "commercial_impression_events_offer_id_book_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."book_offers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_impression_events" ADD CONSTRAINT "commercial_impression_events_daily_feature_id_daily_features_id_fk" FOREIGN KEY ("daily_feature_id") REFERENCES "public"."daily_features"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commercial_impression_events" ADD CONSTRAINT "commercial_impression_events_recommendation_result_id_recommendation_results_id_fk" FOREIGN KEY ("recommendation_result_id") REFERENCES "public"."recommendation_results"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commercial_click_events_clicked_at_idx" ON "commercial_click_events" USING btree ("clicked_at");--> statement-breakpoint
CREATE INDEX "commercial_click_events_book_clicked_idx" ON "commercial_click_events" USING btree ("book_id","clicked_at");--> statement-breakpoint
CREATE INDEX "commercial_click_events_partner_clicked_idx" ON "commercial_click_events" USING btree ("partner_id","clicked_at");--> statement-breakpoint
CREATE INDEX "commercial_click_events_offer_clicked_idx" ON "commercial_click_events" USING btree ("offer_id","clicked_at");--> statement-breakpoint
CREATE INDEX "commercial_click_events_context_clicked_idx" ON "commercial_click_events" USING btree ("source_context","clicked_at");--> statement-breakpoint
CREATE INDEX "commercial_impression_events_displayed_at_idx" ON "commercial_impression_events" USING btree ("displayed_at");--> statement-breakpoint
CREATE INDEX "commercial_impression_events_book_displayed_idx" ON "commercial_impression_events" USING btree ("book_id","displayed_at");--> statement-breakpoint
CREATE INDEX "commercial_impression_events_partner_displayed_idx" ON "commercial_impression_events" USING btree ("partner_id","displayed_at");--> statement-breakpoint
CREATE INDEX "commercial_impression_events_offer_displayed_idx" ON "commercial_impression_events" USING btree ("offer_id","displayed_at");--> statement-breakpoint
CREATE INDEX "commercial_impression_events_context_displayed_idx" ON "commercial_impression_events" USING btree ("source_context","displayed_at");--> statement-breakpoint
ALTER TABLE "daily_features" ADD CONSTRAINT "daily_features_primary_offer_id_book_offers_id_fk" FOREIGN KEY ("primary_offer_id") REFERENCES "public"."book_offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retailers" ADD CONSTRAINT "retailers_logo_asset_id_media_assets_id_fk" FOREIGN KEY ("logo_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_features_primary_offer_id_idx" ON "daily_features" USING btree ("primary_offer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "book_offers_edition_primary_unique" ON "book_offers" USING btree ("edition_id") WHERE "book_offers"."is_primary" and "book_offers"."active" and "book_offers"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "book_offers_display_order_idx" ON "book_offers" USING btree ("edition_id","display_order");--> statement-breakpoint
CREATE INDEX "retailers_partner_type_idx" ON "retailers" USING btree ("partner_type");--> statement-breakpoint
ALTER TABLE "book_offers" ADD CONSTRAINT "book_offers_price_currency_together" CHECK ("book_offers"."price" is null or "book_offers"."currency" is not null);--> statement-breakpoint
ALTER TABLE "book_offers" ADD CONSTRAINT "book_offers_display_order_positive" CHECK ("book_offers"."display_order" >= 0);--> statement-breakpoint
ALTER TABLE "book_offers" ADD CONSTRAINT "book_offers_commercial_placement_valid" CHECK ("book_offers"."commercial_placement" in ('none', 'promoted', 'commercial_partnership'));--> statement-breakpoint
ALTER TABLE "retailers" ADD CONSTRAINT "retailers_partner_type_valid" CHECK ("retailers"."partner_type" in ('publisher', 'bookstore', 'marketplace', 'distributor'));