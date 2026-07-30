import type {
  ChildGoal,
  ChildReadingLevel,
  ChildReadingMode,
  GiftOccasion,
  GiftReadingHabit,
  GiftRelationship,
  GiftStyle,
  SelfRecommendationAnswers,
} from "./types";

export type CandidateGenre = {
  id: string;
  name: string;
  slug: string;
  isPrimary: boolean;
};

export type CandidateTrait = {
  code: string;
  score: number;
  confidence: number;
};

export type CandidateMood = {
  slug: string;
  name: string;
  strength: number;
};

export type CandidateReferenceRelation = {
  type: string;
  strength: number;
  reason: string;
};

export type RecommendationCandidate = {
  id: string;
  title: string;
  slug: string;
  shortVerdict: string;
  editorialConfidence: number;
  editorialUpdatedAt: Date;
  author: { id: string; name: string; slug: string };
  edition: {
    pageCount: number | null;
    cover: { id: string; altText: string; width: number; height: number };
  };
  review: {
    whyRead: string | null;
    whyNot: string | null;
    caveats: string[];
  };
  genres: CandidateGenre[];
  moods: CandidateMood[];
  themes: Array<{ slug: string; name: string }>;
  traits: CandidateTrait[];
  audiences: Array<{
    slug: string;
    minimumAge: number | null;
    maximumAge: number | null;
  }>;
  referenceRelations: CandidateReferenceRelation[];
};

export type ScoreContribution = {
  component:
    | "need"
    | "genre"
    | "pace"
    | "length"
    | "reference"
    | "audience"
    | "context"
    | "editorial_confidence"
    | "freshness";
  points: number;
  reasonCode?: string;
};

export type ScoredRecommendationCandidate = {
  candidate: RecommendationCandidate;
  score: number;
  contributions: ScoreContribution[];
  penalties: Array<{ points: number; reasonCode: string }>;
  reasonCodes: string[];
};

export type RecommendationEngineInput = {
  answers: Required<Omit<SelfRecommendationAnswers, "likedBookId">> & {
    likedBookId?: string | null;
  };
  context:
    | { branch: "self" }
    | {
        branch: "gift";
        targetAge: number;
        relationship: GiftRelationship;
        occasion: GiftOccasion;
        readingHabit: GiftReadingHabit;
        style: GiftStyle;
      }
    | {
        branch: "child";
        targetAge: number;
        readingLevel: ChildReadingLevel;
        readingMode: ChildReadingMode;
        goal: ChildGoal;
      };
  candidates: RecommendationCandidate[];
};

export type RecommendationExplanationSnapshot = {
  schemaVersion: 1;
  confidenceLabel:
    | "Potrivire excelentă"
    | "Potrivire foarte bună"
    | "Potrivire bună";
  reasons: [string, string, string];
  caveat: string;
};

export type RecommendationEngineResult = ScoredRecommendationCandidate & {
  rank: number;
  explanation: RecommendationExplanationSnapshot;
};
