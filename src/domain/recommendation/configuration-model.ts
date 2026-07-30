export const recommendationConfigurationKey = "default";

export type RecommendationConfiguration = {
  minimumScore: number;
  needWeight: number;
  genreWeight: number;
  paceWeight: number;
  lengthWeight: number;
  referenceWeight: number;
  editorialConfidenceWeight: number;
  freshnessWeight: number;
  revision: number;
};

export const defaultRecommendationConfiguration: RecommendationConfiguration = {
  minimumScore: 35,
  needWeight: 26,
  genreWeight: 16,
  paceWeight: 12,
  lengthWeight: 8,
  referenceWeight: 18,
  editorialConfidenceWeight: 8,
  freshnessWeight: 4,
  revision: 1,
};
