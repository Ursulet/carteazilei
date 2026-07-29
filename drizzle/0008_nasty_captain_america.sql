CREATE TABLE "product_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" text NOT NULL,
	"anonymous_session_id" text,
	"recommendation_session_id" uuid,
	"recommendation_result_id" uuid,
	"book_id" uuid,
	"daily_feature_id" uuid,
	"offer_id" uuid,
	"result_rank" integer,
	"algorithm_version" text,
	"source_path" text,
	"dedupe_key" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_events_name_valid" CHECK ("product_events"."event_name" in ('recommendation_quiz_started', 'recommendation_quiz_completed', 'recommendation_result_shown', 'recommendation_alternative_requested', 'book_viewed', 'daily_feature_viewed', 'retailer_click', 'recommendation_feedback_positive', 'recommendation_feedback_negative', 'book_started', 'book_finished')),
	CONSTRAINT "product_events_rank_valid" CHECK ("product_events"."result_rank" is null or "product_events"."result_rank" between 1 and 3),
	CONSTRAINT "product_events_reference_valid" CHECK (case
        when "product_events"."event_name" in ('recommendation_quiz_started', 'recommendation_quiz_completed')
          then "product_events"."recommendation_session_id" is not null
        when "product_events"."event_name" in ('recommendation_result_shown', 'recommendation_alternative_requested', 'recommendation_feedback_positive', 'recommendation_feedback_negative', 'book_started', 'book_finished')
          then "product_events"."recommendation_session_id" is not null and "product_events"."recommendation_result_id" is not null and "product_events"."book_id" is not null
        when "product_events"."event_name" = 'book_viewed'
          then "product_events"."book_id" is not null
        when "product_events"."event_name" = 'daily_feature_viewed'
          then "product_events"."daily_feature_id" is not null and "product_events"."book_id" is not null
        when "product_events"."event_name" = 'retailer_click'
          then "product_events"."offer_id" is not null and "product_events"."book_id" is not null
        else false
      end)
);
--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_recommendation_session_id_recommendation_sessions_id_fk" FOREIGN KEY ("recommendation_session_id") REFERENCES "public"."recommendation_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_recommendation_result_id_recommendation_results_id_fk" FOREIGN KEY ("recommendation_result_id") REFERENCES "public"."recommendation_results"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_daily_feature_id_daily_features_id_fk" FOREIGN KEY ("daily_feature_id") REFERENCES "public"."daily_features"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_offer_id_book_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."book_offers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_events_dedupe_key_unique" ON "product_events" USING btree ("dedupe_key") WHERE "product_events"."dedupe_key" is not null;--> statement-breakpoint
CREATE INDEX "product_events_name_occurred_idx" ON "product_events" USING btree ("event_name","occurred_at");--> statement-breakpoint
CREATE INDEX "product_events_session_occurred_idx" ON "product_events" USING btree ("recommendation_session_id","occurred_at");--> statement-breakpoint
CREATE INDEX "product_events_book_occurred_idx" ON "product_events" USING btree ("book_id","occurred_at");--> statement-breakpoint
CREATE INDEX "product_events_offer_occurred_idx" ON "product_events" USING btree ("offer_id","occurred_at");
