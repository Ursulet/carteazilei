export const recommendationStepOrder = [
  "need",
  "genres",
  "pace",
  "length",
  "liked_book",
  "deal_breakers",
] as const;

export type RecommendationStep = (typeof recommendationStepOrder)[number];

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

export type LikedBookSummary = {
  id: string;
  title: string;
  author: string;
};

export type RecommendationSessionView = {
  status: "started" | "completed";
  answers: SelfRecommendationAnswers;
  likedBook: LikedBookSummary | null;
};
