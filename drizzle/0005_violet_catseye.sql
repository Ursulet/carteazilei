CREATE TABLE "recommendation_quiz_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"step" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendation_quiz_events_type_valid" CHECK ("recommendation_quiz_events"."event_type" in ('started', 'step_completed', 'completed')),
	CONSTRAINT "recommendation_quiz_events_step_valid" CHECK (("recommendation_quiz_events"."event_type" = 'step_completed' and "recommendation_quiz_events"."step" in ('need', 'genres', 'pace', 'length', 'liked_book', 'deal_breakers')) or ("recommendation_quiz_events"."event_type" <> 'step_completed' and "recommendation_quiz_events"."step" is null))
);
--> statement-breakpoint
CREATE TABLE "recommendation_rate_limits" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"blocked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendation_rate_limits_requests_positive" CHECK ("recommendation_rate_limits"."requests" >= 0)
);
--> statement-breakpoint
ALTER TABLE "recommendation_quiz_events" ADD CONSTRAINT "recommendation_quiz_events_session_id_recommendation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."recommendation_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recommendation_quiz_events_session_step_unique" ON "recommendation_quiz_events" USING btree ("session_id","step") WHERE "recommendation_quiz_events"."event_type" = 'step_completed';--> statement-breakpoint
CREATE UNIQUE INDEX "recommendation_quiz_events_session_started_unique" ON "recommendation_quiz_events" USING btree ("session_id") WHERE "recommendation_quiz_events"."event_type" = 'started';--> statement-breakpoint
CREATE UNIQUE INDEX "recommendation_quiz_events_session_completed_unique" ON "recommendation_quiz_events" USING btree ("session_id") WHERE "recommendation_quiz_events"."event_type" = 'completed';--> statement-breakpoint
CREATE INDEX "recommendation_quiz_events_type_occurred_idx" ON "recommendation_quiz_events" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE INDEX "recommendation_quiz_events_session_id_idx" ON "recommendation_quiz_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "recommendation_rate_limits_updated_at_idx" ON "recommendation_rate_limits" USING btree ("updated_at");