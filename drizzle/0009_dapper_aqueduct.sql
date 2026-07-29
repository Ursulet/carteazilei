CREATE TABLE "legacy_import_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_system" text NOT NULL,
	"source_type" text NOT NULL,
	"legacy_id" text NOT NULL,
	"source_url" text,
	"content_hash" text NOT NULL,
	"target_entity_type" text NOT NULL,
	"target_entity_id" uuid,
	"outcome" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legacy_import_records_source_unique" UNIQUE("source_system","source_type","legacy_id"),
	CONSTRAINT "legacy_import_records_source_system_present" CHECK (length(btrim("legacy_import_records"."source_system")) > 0),
	CONSTRAINT "legacy_import_records_legacy_id_present" CHECK (length(btrim("legacy_import_records"."legacy_id")) > 0),
	CONSTRAINT "legacy_import_records_hash_sha256" CHECK ("legacy_import_records"."content_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "legacy_import_records_source_type_valid" CHECK ("legacy_import_records"."source_type" in ('author', 'book', 'media', 'review', 'daily_feature')),
	CONSTRAINT "legacy_import_records_outcome_valid" CHECK ("legacy_import_records"."outcome" in ('imported', 'linked', 'quarantined'))
);
--> statement-breakpoint
CREATE TABLE "legacy_review_quarantine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_record_id" uuid NOT NULL,
	"book_id" uuid,
	"legacy_book_reference" text,
	"reviewer_name" text,
	"source_label" text,
	"source_url" text,
	"body" text NOT NULL,
	"origin_verified" boolean DEFAULT false NOT NULL,
	"verification_note" text,
	"quarantine_reason" text NOT NULL,
	"status" text DEFAULT 'quarantined' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legacy_review_quarantine_import_record_unique" UNIQUE("import_record_id"),
	CONSTRAINT "legacy_review_quarantine_body_present" CHECK (length(btrim("legacy_review_quarantine"."body")) > 0),
	CONSTRAINT "legacy_review_quarantine_reason_present" CHECK (length(btrim("legacy_review_quarantine"."quarantine_reason")) > 0),
	CONSTRAINT "legacy_review_quarantine_status_valid" CHECK ("legacy_review_quarantine"."status" in ('quarantined', 'verified', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "legacy_review_quarantine" ADD CONSTRAINT "legacy_review_quarantine_import_record_id_legacy_import_records_id_fk" FOREIGN KEY ("import_record_id") REFERENCES "public"."legacy_import_records"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legacy_review_quarantine" ADD CONSTRAINT "legacy_review_quarantine_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "legacy_import_records_target_idx" ON "legacy_import_records" USING btree ("target_entity_type","target_entity_id");--> statement-breakpoint
CREATE INDEX "legacy_import_records_imported_at_idx" ON "legacy_import_records" USING btree ("imported_at");--> statement-breakpoint
CREATE INDEX "legacy_review_quarantine_status_idx" ON "legacy_review_quarantine" USING btree ("status");--> statement-breakpoint
CREATE INDEX "legacy_review_quarantine_book_id_idx" ON "legacy_review_quarantine" USING btree ("book_id");