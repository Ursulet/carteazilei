import { timestamp, uuid } from "drizzle-orm/pg-core";

export const bookStatusValues = [
  "draft",
  "needs_review",
  "ready",
  "published",
  "archived",
] as const;

export const authorStatusValues = [
  "draft",
  "needs_review",
  "published",
  "archived",
] as const;

export const editorialReviewStatusValues = [
  "draft",
  "needs_review",
  "published",
  "archived",
] as const;

export const dailyFeatureStatusValues = [
  "draft",
  "scheduled",
  "published",
  "archived",
] as const;

export const editorialListStatusValues = [
  "draft",
  "review",
  "published",
  "archived",
] as const;

export const taxonomyStatusValues = ["draft", "published", "archived"] as const;

export const roleCodeValues = ["admin", "editor", "analyst"] as const;

export const relationshipTypeValues = [
  "similar_theme",
  "similar_style",
  "similar_pace",
  "similar_world",
  "next_read",
  "contrast_read",
] as const;

export const relationshipProvenanceValues = ["editorial", "algorithmic"] as const;

export const nextReadBasisValues = [
  "theme",
  "pace",
  "style",
  "world",
  "emotional_effect",
] as const;

export const recommendationBranchValues = ["self", "gift", "child"] as const;

export const recommendationSessionStatusValues = [
  "started",
  "completed",
  "expired",
] as const;

export const recommendationQuizEventTypeValues = [
  "started",
  "step_completed",
  "completed",
] as const;

export const recommendationQuizStepValues = [
  "need",
  "genres",
  "pace",
  "length",
  "liked_book",
  "deal_breakers",
] as const;

export const recommendationFeedbackActionValues = [
  "positive",
  "negative",
  "started",
  "finished",
  "rating",
] as const;

export const commercialPartnerTypeValues = [
  "publisher",
  "bookstore",
  "marketplace",
  "distributor",
] as const;

export const commercialPlacementValues = [
  "none",
  "promoted",
  "commercial_partnership",
] as const;

export const commercialClickContextValues = [
  "book_page",
  "daily_feature",
  "recommendation",
  "other",
] as const;

export const productEventNameValues = [
  "page_viewed",
  "recommendation_quiz_started",
  "recommendation_quiz_completed",
  "recommendation_result_shown",
  "recommendation_alternative_requested",
  "book_viewed",
  "daily_feature_viewed",
  "retailer_click",
  "recommendation_feedback_positive",
  "recommendation_feedback_negative",
  "book_started",
  "book_finished",
] as const;

export const acquisitionChannelValues = [
  "direct",
  "organic",
  "referral",
  "internal",
] as const;

export const entityTypeValues = [
  "book",
  "author",
  "editor",
  "editorial_list",
  "genre",
  "theme",
  "mood",
  "audience",
  "daily_feature",
  "page",
] as const;

export const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const softDelete = () => ({
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const uuidPrimaryKey = () => uuid("id").defaultRandom().primaryKey();
