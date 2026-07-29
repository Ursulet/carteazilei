CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"diff" jsonb,
	"metadata" jsonb,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"search_intent" text,
	"editorial_intro" text,
	"editor_id" uuid,
	"indexable" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"minimum_age" integer,
	"maximum_age" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "audiences_slug_unique" UNIQUE("slug"),
	CONSTRAINT "audiences_status_valid" CHECK ("audiences"."status" in ('draft', 'published', 'archived')),
	CONSTRAINT "audiences_age_range_valid" CHECK (("audiences"."minimum_age" is null or "audiences"."minimum_age" >= 0) and ("audiences"."maximum_age" is null or "audiences"."maximum_age" >= coalesce("audiences"."minimum_age", 0)))
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"bio" text,
	"verified_facts" text,
	"source_notes" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "authors_slug_unique" UNIQUE("slug"),
	CONSTRAINT "authors_status_valid" CHECK ("authors"."status" in ('draft', 'needs_review', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "book_audiences" (
	"book_id" uuid NOT NULL,
	"audience_id" uuid NOT NULL,
	CONSTRAINT "book_audiences_book_id_audience_id_pk" PRIMARY KEY("book_id","audience_id")
);
--> statement-breakpoint
CREATE TABLE "book_editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"isbn10" text,
	"isbn13" text,
	"publisher" text,
	"publication_year" integer,
	"publication_date" date,
	"language" text DEFAULT 'ro' NOT NULL,
	"page_count" integer,
	"cover_asset_id" uuid,
	"edition_label" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "book_editions_isbn10_unique" UNIQUE("isbn10"),
	CONSTRAINT "book_editions_isbn13_unique" UNIQUE("isbn13"),
	CONSTRAINT "book_editions_isbn10_format" CHECK ("book_editions"."isbn10" is null or "book_editions"."isbn10" ~ '^[0-9X]{10}$'),
	CONSTRAINT "book_editions_isbn13_format" CHECK ("book_editions"."isbn13" is null or "book_editions"."isbn13" ~ '^[0-9]{13}$'),
	CONSTRAINT "book_editions_publication_year_range" CHECK ("book_editions"."publication_year" is null or "book_editions"."publication_year" between 1450 and 3000),
	CONSTRAINT "book_editions_page_count_positive" CHECK ("book_editions"."page_count" is null or "book_editions"."page_count" > 0)
);
--> statement-breakpoint
CREATE TABLE "book_genres" (
	"book_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "book_genres_book_id_genre_id_pk" PRIMARY KEY("book_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "book_moods" (
	"book_id" uuid NOT NULL,
	"mood_id" uuid NOT NULL,
	"strength" integer DEFAULT 50 NOT NULL,
	CONSTRAINT "book_moods_book_id_mood_id_pk" PRIMARY KEY("book_id","mood_id"),
	CONSTRAINT "book_moods_strength_range" CHECK ("book_moods"."strength" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "book_themes" (
	"book_id" uuid NOT NULL,
	"theme_id" uuid NOT NULL,
	CONSTRAINT "book_themes_book_id_theme_id_pk" PRIMARY KEY("book_id","theme_id")
);
--> statement-breakpoint
CREATE TABLE "book_trait_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"trait_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"editor_note" text,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_trait_scores_book_trait_unique" UNIQUE("book_id","trait_id"),
	CONSTRAINT "book_trait_scores_score_range" CHECK ("book_trait_scores"."score" between 0 and 100),
	CONSTRAINT "book_trait_scores_confidence_range" CHECK ("book_trait_scores"."confidence" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"slug" text NOT NULL,
	"original_title" text,
	"primary_author_id" uuid NOT NULL,
	"short_verdict" text,
	"spoiler_free_summary" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"editorial_confidence" integer DEFAULT 0 NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"search_document" "tsvector" DEFAULT to_tsvector('simple', '') NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "books_slug_unique" UNIQUE("slug"),
	CONSTRAINT "books_status_valid" CHECK ("books"."status" in ('draft', 'needs_review', 'ready', 'published', 'archived')),
	CONSTRAINT "books_editorial_confidence_range" CHECK ("books"."editorial_confidence" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"search_intent" text,
	"editorial_intro" text,
	"editor_id" uuid,
	"indexable" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "genres_slug_unique" UNIQUE("slug"),
	CONSTRAINT "genres_status_valid" CHECK ("genres"."status" in ('draft', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "moods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"search_intent" text,
	"editorial_intro" text,
	"editor_id" uuid,
	"indexable" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "moods_slug_unique" UNIQUE("slug"),
	CONSTRAINT "moods_status_valid" CHECK ("moods"."status" in ('draft', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "reading_traits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_traits_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"search_intent" text,
	"editorial_intro" text,
	"editor_id" uuid,
	"indexable" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "themes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "themes_status_valid" CHECK ("themes"."status" in ('draft', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "book_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_book_id" uuid NOT NULL,
	"target_book_id" uuid NOT NULL,
	"type" text NOT NULL,
	"strength" integer NOT NULL,
	"public_reason" text,
	"provenance" text NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_relationships_source_target_type_unique" UNIQUE("source_book_id","target_book_id","type"),
	CONSTRAINT "book_relationships_not_self" CHECK ("book_relationships"."source_book_id" <> "book_relationships"."target_book_id"),
	CONSTRAINT "book_relationships_type_valid" CHECK ("book_relationships"."type" in ('similar_theme', 'similar_style', 'similar_pace', 'similar_world', 'next_read', 'contrast_read')),
	CONSTRAINT "book_relationships_provenance_valid" CHECK ("book_relationships"."provenance" in ('editorial', 'algorithmic')),
	CONSTRAINT "book_relationships_strength_range" CHECK ("book_relationships"."strength" between 0 and 100),
	CONSTRAINT "book_relationships_active_approval" CHECK (not "book_relationships"."active" or ("book_relationships"."approved_by" is not null and "book_relationships"."approved_at" is not null and nullif(btrim("book_relationships"."public_reason"), '') is not null))
);
--> statement-breakpoint
CREATE TABLE "daily_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_date" date NOT NULL,
	"book_id" uuid NOT NULL,
	"editor_id" uuid NOT NULL,
	"headline" text,
	"why_today" text,
	"audience_note" text,
	"fit_points" text[] DEFAULT '{}'::text[] NOT NULL,
	"caveat" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "daily_features_feature_date_unique" UNIQUE("feature_date"),
	CONSTRAINT "daily_features_status_valid" CHECK ("daily_features"."status" in ('draft', 'scheduled', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "editorial_list_books" (
	"list_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"rank" integer,
	"segment" text,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "editorial_list_books_list_id_book_id_pk" PRIMARY KEY("list_id","book_id"),
	CONSTRAINT "editorial_list_books_list_position_unique" UNIQUE("list_id","position"),
	CONSTRAINT "editorial_list_books_position_positive" CHECK ("editorial_list_books"."position" > 0),
	CONSTRAINT "editorial_list_books_rank_positive" CHECK ("editorial_list_books"."rank" is null or "editorial_list_books"."rank" > 0)
);
--> statement-breakpoint
CREATE TABLE "editorial_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"intro" text,
	"methodology" text,
	"editor_id" uuid NOT NULL,
	"type" text NOT NULL,
	"indexable" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "editorial_lists_slug_unique" UNIQUE("slug"),
	CONSTRAINT "editorial_lists_type_valid" CHECK ("editorial_lists"."type" in ('list', 'hub', 'guide', 'next_read', 'similar_books')),
	CONSTRAINT "editorial_lists_status_valid" CHECK ("editorial_lists"."status" in ('draft', 'review', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "editorial_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"editor_id" uuid NOT NULL,
	"verdict" text,
	"why_read" text,
	"why_not" text,
	"strengths" text[] DEFAULT '{}'::text[] NOT NULL,
	"caveats" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "editorial_reviews_status_valid" CHECK ("editorial_reviews"."status" in ('draft', 'needs_review', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "editors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"slug" text NOT NULL,
	"bio" text,
	"expertise" text[] DEFAULT '{}'::text[] NOT NULL,
	"avatar_asset_id" uuid,
	"public_profile" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "editors_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "editors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_code_unique" UNIQUE("code"),
	CONSTRAINT "roles_code_valid" CHECK ("roles"."code" in ('admin', 'editor', 'analyst'))
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" uuid,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text,
	"email_verified_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"alt_text" text NOT NULL,
	"attribution" text,
	"source" text,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "media_assets_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "media_assets_byte_size_positive" CHECK ("media_assets"."byte_size" > 0),
	CONSTRAINT "media_assets_width_positive" CHECK ("media_assets"."width" is null or "media_assets"."width" > 0),
	CONSTRAINT "media_assets_height_positive" CHECK ("media_assets"."height" is null or "media_assets"."height" > 0),
	CONSTRAINT "media_assets_dimensions_together" CHECK (("media_assets"."width" is null and "media_assets"."height" is null) or ("media_assets"."width" is not null and "media_assets"."height" is not null))
);
--> statement-breakpoint
CREATE TABLE "recommendation_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"result_id" uuid NOT NULL,
	"action" text NOT NULL,
	"rating" integer,
	"feedback_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"free_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendation_feedback_result_action_unique" UNIQUE("result_id","action"),
	CONSTRAINT "recommendation_feedback_action_valid" CHECK ("recommendation_feedback"."action" in ('positive', 'negative', 'started', 'finished', 'rating')),
	CONSTRAINT "recommendation_feedback_rating_valid" CHECK (("recommendation_feedback"."action" = 'rating' and "recommendation_feedback"."rating" between 1 and 5) or ("recommendation_feedback"."action" <> 'rating' and "recommendation_feedback"."rating" is null))
);
--> statement-breakpoint
CREATE TABLE "recommendation_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"score" numeric(6, 2) NOT NULL,
	"reason_codes" jsonb NOT NULL,
	"explanation_snapshot" text NOT NULL,
	"algorithm_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendation_results_session_rank_unique" UNIQUE("session_id","rank"),
	CONSTRAINT "recommendation_results_session_book_unique" UNIQUE("session_id","book_id"),
	CONSTRAINT "recommendation_results_rank_range" CHECK ("recommendation_results"."rank" between 1 and 3),
	CONSTRAINT "recommendation_results_score_range" CHECK ("recommendation_results"."score" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "recommendation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opaque_token" text NOT NULL,
	"anonymous_session_id" text NOT NULL,
	"user_id" uuid,
	"branch" text NOT NULL,
	"status" text DEFAULT 'started' NOT NULL,
	"answers_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "recommendation_sessions_opaque_token_unique" UNIQUE("opaque_token"),
	CONSTRAINT "recommendation_sessions_branch_valid" CHECK ("recommendation_sessions"."branch" in ('self', 'gift', 'child')),
	CONSTRAINT "recommendation_sessions_status_valid" CHECK ("recommendation_sessions"."status" in ('started', 'completed', 'expired')),
	CONSTRAINT "recommendation_sessions_expiry_valid" CHECK ("recommendation_sessions"."expires_at" > "recommendation_sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "book_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"edition_id" uuid NOT NULL,
	"retailer_id" uuid NOT NULL,
	"purchase_url" text NOT NULL,
	"affiliate" boolean DEFAULT false NOT NULL,
	"price" numeric(12, 2),
	"currency" text,
	"availability" text,
	"checked_at" timestamp with time zone,
	"source" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "book_offers_edition_retailer_url_unique" UNIQUE("edition_id","retailer_id","purchase_url"),
	CONSTRAINT "book_offers_purchase_url_https" CHECK ("book_offers"."purchase_url" ~ '^https://'),
	CONSTRAINT "book_offers_price_positive" CHECK ("book_offers"."price" is null or "book_offers"."price" >= 0),
	CONSTRAINT "book_offers_currency_format" CHECK ("book_offers"."currency" is null or "book_offers"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "book_offers_availability_valid" CHECK ("book_offers"."availability" is null or "book_offers"."availability" in ('in_stock', 'out_of_stock', 'preorder', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "retailers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"base_url" text NOT NULL,
	"affiliate_disclosure" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "retailers_slug_unique" UNIQUE("slug"),
	CONSTRAINT "retailers_base_url_https" CHECK ("retailers"."base_url" ~ '^https://')
);
--> statement-breakpoint
CREATE TABLE "seo_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"title_override" text,
	"description_override" text,
	"canonical_override" text,
	"og_asset_id" uuid,
	"indexable" boolean DEFAULT false NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seo_metadata_entity_unique" UNIQUE("entity_type","entity_id"),
	CONSTRAINT "seo_metadata_entity_type_valid" CHECK ("seo_metadata"."entity_type" in ('book', 'author', 'editor', 'editorial_list', 'genre', 'theme', 'mood', 'audience', 'daily_feature', 'page')),
	CONSTRAINT "seo_metadata_canonical_https" CHECK ("seo_metadata"."canonical_override" is null or "seo_metadata"."canonical_override" ~ '^https://')
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audiences" ADD CONSTRAINT "audiences_editor_id_editors_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."editors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_audiences" ADD CONSTRAINT "book_audiences_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_audiences" ADD CONSTRAINT "book_audiences_audience_id_audiences_id_fk" FOREIGN KEY ("audience_id") REFERENCES "public"."audiences"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_editions" ADD CONSTRAINT "book_editions_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_editions" ADD CONSTRAINT "book_editions_cover_asset_id_media_assets_id_fk" FOREIGN KEY ("cover_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_genres" ADD CONSTRAINT "book_genres_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_genres" ADD CONSTRAINT "book_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_moods" ADD CONSTRAINT "book_moods_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_moods" ADD CONSTRAINT "book_moods_mood_id_moods_id_fk" FOREIGN KEY ("mood_id") REFERENCES "public"."moods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_themes" ADD CONSTRAINT "book_themes_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_themes" ADD CONSTRAINT "book_themes_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_trait_scores" ADD CONSTRAINT "book_trait_scores_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_trait_scores" ADD CONSTRAINT "book_trait_scores_trait_id_reading_traits_id_fk" FOREIGN KEY ("trait_id") REFERENCES "public"."reading_traits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_trait_scores" ADD CONSTRAINT "book_trait_scores_updated_by_editors_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."editors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_primary_author_id_authors_id_fk" FOREIGN KEY ("primary_author_id") REFERENCES "public"."authors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genres" ADD CONSTRAINT "genres_editor_id_editors_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."editors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moods" ADD CONSTRAINT "moods_editor_id_editors_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."editors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_editor_id_editors_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."editors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_relationships" ADD CONSTRAINT "book_relationships_source_book_id_books_id_fk" FOREIGN KEY ("source_book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_relationships" ADD CONSTRAINT "book_relationships_target_book_id_books_id_fk" FOREIGN KEY ("target_book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_relationships" ADD CONSTRAINT "book_relationships_approved_by_editors_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."editors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_features" ADD CONSTRAINT "daily_features_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_features" ADD CONSTRAINT "daily_features_editor_id_editors_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."editors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editorial_list_books" ADD CONSTRAINT "editorial_list_books_list_id_editorial_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."editorial_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editorial_list_books" ADD CONSTRAINT "editorial_list_books_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editorial_lists" ADD CONSTRAINT "editorial_lists_editor_id_editors_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."editors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editorial_reviews" ADD CONSTRAINT "editorial_reviews_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editorial_reviews" ADD CONSTRAINT "editorial_reviews_editor_id_editors_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."editors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editors" ADD CONSTRAINT "editors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editors" ADD CONSTRAINT "editors_avatar_asset_id_media_assets_id_fk" FOREIGN KEY ("avatar_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_result_id_recommendation_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."recommendation_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_results" ADD CONSTRAINT "recommendation_results_session_id_recommendation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."recommendation_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_results" ADD CONSTRAINT "recommendation_results_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_sessions" ADD CONSTRAINT "recommendation_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_offers" ADD CONSTRAINT "book_offers_edition_id_book_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."book_editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_offers" ADD CONSTRAINT "book_offers_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_metadata" ADD CONSTRAINT "seo_metadata_og_asset_id_media_assets_id_fk" FOREIGN KEY ("og_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_created_idx" ON "audit_logs" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audiences_status_indexable_idx" ON "audiences" USING btree ("status","indexable");--> statement-breakpoint
CREATE INDEX "audiences_editor_id_idx" ON "audiences" USING btree ("editor_id");--> statement-breakpoint
CREATE INDEX "authors_status_idx" ON "authors" USING btree ("status");--> statement-breakpoint
CREATE INDEX "authors_name_trgm_idx" ON "authors" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "book_audiences_audience_id_idx" ON "book_audiences" USING btree ("audience_id");--> statement-breakpoint
CREATE INDEX "book_editions_book_id_idx" ON "book_editions" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "book_editions_active_idx" ON "book_editions" USING btree ("active");--> statement-breakpoint
CREATE INDEX "book_genres_genre_id_idx" ON "book_genres" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "book_moods_mood_id_idx" ON "book_moods" USING btree ("mood_id");--> statement-breakpoint
CREATE INDEX "book_themes_theme_id_idx" ON "book_themes" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "book_trait_scores_trait_id_idx" ON "book_trait_scores" USING btree ("trait_id");--> statement-breakpoint
CREATE INDEX "books_primary_author_id_idx" ON "books" USING btree ("primary_author_id");--> statement-breakpoint
CREATE INDEX "books_status_idx" ON "books" USING btree ("status");--> statement-breakpoint
CREATE INDEX "books_title_trgm_idx" ON "books" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "books_search_text_trgm_idx" ON "books" USING gin ("search_text" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "books_search_document_idx" ON "books" USING gin ("search_document");--> statement-breakpoint
CREATE INDEX "genres_status_indexable_idx" ON "genres" USING btree ("status","indexable");--> statement-breakpoint
CREATE INDEX "genres_editor_id_idx" ON "genres" USING btree ("editor_id");--> statement-breakpoint
CREATE INDEX "moods_status_indexable_idx" ON "moods" USING btree ("status","indexable");--> statement-breakpoint
CREATE INDEX "moods_editor_id_idx" ON "moods" USING btree ("editor_id");--> statement-breakpoint
CREATE INDEX "reading_traits_active_idx" ON "reading_traits" USING btree ("active");--> statement-breakpoint
CREATE INDEX "themes_status_indexable_idx" ON "themes" USING btree ("status","indexable");--> statement-breakpoint
CREATE INDEX "themes_editor_id_idx" ON "themes" USING btree ("editor_id");--> statement-breakpoint
CREATE INDEX "book_relationships_source_active_idx" ON "book_relationships" USING btree ("source_book_id","active");--> statement-breakpoint
CREATE INDEX "book_relationships_target_active_idx" ON "book_relationships" USING btree ("target_book_id","active");--> statement-breakpoint
CREATE INDEX "daily_features_status_date_idx" ON "daily_features" USING btree ("status","feature_date");--> statement-breakpoint
CREATE INDEX "daily_features_book_id_idx" ON "daily_features" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "editorial_list_books_book_id_idx" ON "editorial_list_books" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "editorial_lists_status_type_idx" ON "editorial_lists" USING btree ("status","type");--> statement-breakpoint
CREATE INDEX "editorial_lists_editor_id_idx" ON "editorial_lists" USING btree ("editor_id");--> statement-breakpoint
CREATE INDEX "editorial_reviews_book_status_idx" ON "editorial_reviews" USING btree ("book_id","status");--> statement-breakpoint
CREATE INDEX "editorial_reviews_editor_id_idx" ON "editorial_reviews" USING btree ("editor_id");--> statement-breakpoint
CREATE INDEX "editors_public_profile_idx" ON "editors" USING btree ("public_profile");--> statement-breakpoint
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("active");--> statement-breakpoint
CREATE INDEX "media_assets_mime_type_idx" ON "media_assets" USING btree ("mime_type");--> statement-breakpoint
CREATE INDEX "recommendation_feedback_created_at_idx" ON "recommendation_feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "recommendation_results_book_id_idx" ON "recommendation_results" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "recommendation_sessions_anonymous_id_idx" ON "recommendation_sessions" USING btree ("anonymous_session_id");--> statement-breakpoint
CREATE INDEX "recommendation_sessions_expires_at_idx" ON "recommendation_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "recommendation_sessions_user_id_idx" ON "recommendation_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "book_offers_edition_active_idx" ON "book_offers" USING btree ("edition_id","active");--> statement-breakpoint
CREATE INDEX "book_offers_retailer_id_idx" ON "book_offers" USING btree ("retailer_id");--> statement-breakpoint
CREATE INDEX "retailers_active_idx" ON "retailers" USING btree ("active");--> statement-breakpoint
CREATE INDEX "seo_metadata_indexable_idx" ON "seo_metadata" USING btree ("indexable");