ALTER TABLE "product_events" DROP CONSTRAINT "product_events_name_valid";--> statement-breakpoint
ALTER TABLE "product_events" DROP CONSTRAINT "product_events_reference_valid";--> statement-breakpoint
ALTER TABLE "product_events" ADD COLUMN "acquisition_channel" text;--> statement-breakpoint
ALTER TABLE "product_events" ADD COLUMN "referrer_host" text;--> statement-breakpoint
ALTER TABLE "product_events" ADD COLUMN "is_landing" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "product_events_acquisition_occurred_idx" ON "product_events" USING btree ("acquisition_channel","occurred_at");--> statement-breakpoint
CREATE INDEX "product_events_path_occurred_idx" ON "product_events" USING btree ("source_path","occurred_at");--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_acquisition_channel_valid" CHECK ("product_events"."acquisition_channel" is null or "product_events"."acquisition_channel" in ('direct', 'organic', 'referral', 'internal'));--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_referrer_host_length" CHECK ("product_events"."referrer_host" is null or length("product_events"."referrer_host") <= 253);--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_name_valid" CHECK ("product_events"."event_name" in ('page_viewed', 'recommendation_quiz_started', 'recommendation_quiz_completed', 'recommendation_result_shown', 'recommendation_alternative_requested', 'book_viewed', 'daily_feature_viewed', 'retailer_click', 'recommendation_feedback_positive', 'recommendation_feedback_negative', 'book_started', 'book_finished'));--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_reference_valid" CHECK (case
        when "product_events"."event_name" = 'page_viewed'
          then "product_events"."source_path" is not null and "product_events"."acquisition_channel" is not null
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
      end);