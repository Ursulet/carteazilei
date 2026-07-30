export const recommendationStepOrder = [
  "need",
  "genres",
  "pace",
  "length",
  "liked_book",
  "deal_breakers",
] as const;

export const giftRecommendationStepOrder = [
  "gift_relationship",
  "gift_age",
  "gift_occasion",
  "gift_interests",
  "gift_reading_habit",
  "gift_style",
] as const;

export const childRecommendationStepOrder = [
  "child_age",
  "child_reading_level",
  "child_reading_mode",
  "child_interests",
  "child_goal",
  "child_sensitivities",
] as const;

export const recommendationBranchValues = ["self", "gift", "child"] as const;
export type RecommendationBranch = (typeof recommendationBranchValues)[number];

export type RecommendationStep =
  | (typeof recommendationStepOrder)[number]
  | (typeof giftRecommendationStepOrder)[number]
  | (typeof childRecommendationStepOrder)[number];

export const readingNeedValues = [
  "captivating",
  "relaxing",
  "thought_provoking",
  "learning",
  "emotional",
  "out_of_routine",
] as const;
export type ReadingNeed = (typeof readingNeedValues)[number];

export const readingPaceValues = [
  "slow_atmospheric",
  "balanced",
  "fast",
  "any",
] as const;
export type ReadingPace = (typeof readingPaceValues)[number];

export const readingLengthValues = [
  "under_200",
  "200_350",
  "350_500",
  "over_500",
  "any",
] as const;
export type ReadingLength = (typeof readingLengthValues)[number];

export const dealBreakerValues = [
  "too_much_romance",
  "explicit_violence",
  "heavy_topics",
  "slow_burn",
  "technical_explanations",
  "ambiguous_ending",
  "none",
] as const;
export type DealBreaker = (typeof dealBreakerValues)[number];

export type SelfRecommendationAnswers = {
  need?: ReadingNeed;
  genres?: string[];
  pace?: ReadingPace;
  length?: ReadingLength;
  likedBookId?: string | null;
  dealBreakers?: DealBreaker[];
};

export const giftRelationshipValues = [
  "partner",
  "family",
  "friend",
  "colleague",
  "teacher",
  "other",
] as const;
export type GiftRelationship = (typeof giftRelationshipValues)[number];

export const giftAgeValues = ["13_17", "18_25", "26_40", "41_60", "60_plus"] as const;
export type GiftAge = (typeof giftAgeValues)[number];

export const giftOccasionValues = [
  "birthday",
  "holidays",
  "thank_you",
  "celebration",
  "no_occasion",
] as const;
export type GiftOccasion = (typeof giftOccasionValues)[number];

export const giftReadingHabitValues = ["rare", "occasional", "regular", "avid", "unknown"] as const;
export type GiftReadingHabit = (typeof giftReadingHabitValues)[number];

export const giftStyleValues = ["safe", "balanced", "surprise"] as const;
export type GiftStyle = (typeof giftStyleValues)[number];

export type GiftRecommendationAnswers = {
  giftRelationship?: GiftRelationship;
  giftAge?: GiftAge;
  giftOccasion?: GiftOccasion;
  giftInterests?: string[];
  giftReadingHabit?: GiftReadingHabit;
  giftStyle?: GiftStyle;
};

export const childAgeValues = ["3_5", "6_8", "9_12", "13_15", "16_17"] as const;
export type ChildAge = (typeof childAgeValues)[number];

export const childReadingLevelValues = ["beginner", "independent", "advanced"] as const;
export type ChildReadingLevel = (typeof childReadingLevelValues)[number];

export const childReadingModeValues = ["alone", "together", "both"] as const;
export type ChildReadingMode = (typeof childReadingModeValues)[number];

export const childGoalValues = ["joy", "confidence", "learning", "emotional"] as const;
export type ChildGoal = (typeof childGoalValues)[number];

export const childSensitivityValues = ["violence", "scary", "grief", "complex", "none"] as const;
export type ChildSensitivity = (typeof childSensitivityValues)[number];

export type ChildRecommendationAnswers = {
  childAge?: ChildAge;
  childReadingLevel?: ChildReadingLevel;
  childReadingMode?: ChildReadingMode;
  childInterests?: string[];
  childGoal?: ChildGoal;
  childSensitivities?: ChildSensitivity[];
};

export type RecommendationAnswers = SelfRecommendationAnswers &
  GiftRecommendationAnswers &
  ChildRecommendationAnswers;

export type LikedBookSummary = {
  id: string;
  title: string;
  author: string;
};

export type RecommendationSessionView = {
  branch: RecommendationBranch;
  status: "started" | "completed";
  answers: RecommendationAnswers;
  likedBook: LikedBookSummary | null;
};

export function recommendationStepsForBranch(branch: RecommendationBranch): readonly RecommendationStep[] {
  if (branch === "gift") return giftRecommendationStepOrder;
  if (branch === "child") return childRecommendationStepOrder;
  return recommendationStepOrder;
}
