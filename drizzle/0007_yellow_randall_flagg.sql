ALTER TABLE "editorial_lists" DROP CONSTRAINT "editorial_lists_type_valid";--> statement-breakpoint
ALTER TABLE "audiences" ADD COLUMN "methodology" text;--> statement-breakpoint
ALTER TABLE "book_audiences" ADD COLUMN "hub_position" integer;--> statement-breakpoint
ALTER TABLE "book_audiences" ADD COLUMN "hub_reason" text;--> statement-breakpoint
ALTER TABLE "book_genres" ADD COLUMN "hub_position" integer;--> statement-breakpoint
ALTER TABLE "book_genres" ADD COLUMN "hub_reason" text;--> statement-breakpoint
ALTER TABLE "book_moods" ADD COLUMN "hub_position" integer;--> statement-breakpoint
ALTER TABLE "book_moods" ADD COLUMN "hub_reason" text;--> statement-breakpoint
ALTER TABLE "book_themes" ADD COLUMN "hub_position" integer;--> statement-breakpoint
ALTER TABLE "book_themes" ADD COLUMN "hub_reason" text;--> statement-breakpoint
ALTER TABLE "genres" ADD COLUMN "methodology" text;--> statement-breakpoint
ALTER TABLE "moods" ADD COLUMN "methodology" text;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "methodology" text;--> statement-breakpoint
ALTER TABLE "book_relationships" ADD COLUMN "next_read_basis" text;--> statement-breakpoint
ALTER TABLE "editorial_lists" ADD COLUMN "minimum_page_count" integer;--> statement-breakpoint
ALTER TABLE "editorial_lists" ADD COLUMN "maximum_page_count" integer;--> statement-breakpoint
ALTER TABLE "book_audiences" ADD CONSTRAINT "book_audiences_hub_position_positive" CHECK ("book_audiences"."hub_position" is null or "book_audiences"."hub_position" > 0);--> statement-breakpoint
ALTER TABLE "book_genres" ADD CONSTRAINT "book_genres_hub_position_positive" CHECK ("book_genres"."hub_position" is null or "book_genres"."hub_position" > 0);--> statement-breakpoint
ALTER TABLE "book_moods" ADD CONSTRAINT "book_moods_hub_position_positive" CHECK ("book_moods"."hub_position" is null or "book_moods"."hub_position" > 0);--> statement-breakpoint
ALTER TABLE "book_themes" ADD CONSTRAINT "book_themes_hub_position_positive" CHECK ("book_themes"."hub_position" is null or "book_themes"."hub_position" > 0);--> statement-breakpoint
ALTER TABLE "book_relationships" ADD CONSTRAINT "book_relationships_next_read_basis_valid" CHECK ("book_relationships"."next_read_basis" is null or ("book_relationships"."type" = 'next_read' and "book_relationships"."next_read_basis" in ('theme', 'pace', 'style', 'world', 'emotional_effect')));--> statement-breakpoint
ALTER TABLE "editorial_lists" ADD CONSTRAINT "editorial_lists_page_range_valid" CHECK (("editorial_lists"."type" = 'length_hub' and ("editorial_lists"."minimum_page_count" is not null or "editorial_lists"."maximum_page_count" is not null) and coalesce("editorial_lists"."minimum_page_count", 0) >= 0 and ("editorial_lists"."maximum_page_count" is null or "editorial_lists"."maximum_page_count" >= coalesce("editorial_lists"."minimum_page_count", 0))) or ("editorial_lists"."type" <> 'length_hub' and "editorial_lists"."minimum_page_count" is null and "editorial_lists"."maximum_page_count" is null));--> statement-breakpoint
ALTER TABLE "editorial_lists" ADD CONSTRAINT "editorial_lists_type_valid" CHECK ("editorial_lists"."type" in ('list', 'hub', 'guide', 'length_hub', 'next_read', 'similar_books'));