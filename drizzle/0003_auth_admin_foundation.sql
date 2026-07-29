CREATE TABLE "auth_rate_limits" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"blocked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_rate_limits_attempts_positive" CHECK ("auth_rate_limits"."attempts" >= 0)
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "session_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "auth_rate_limits_updated_at_idx" ON "auth_rate_limits" USING btree ("updated_at");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_session_version_positive" CHECK ("users"."session_version" >= 0);