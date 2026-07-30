import type { RecommendationCandidate, RecommendationEngineInput } from "./engine-types";
import type {
  ChildAge,
  ChildSensitivity,
  DealBreaker,
  GiftAge,
  RecommendationAnswers,
  RecommendationBranch,
  ReadingLength,
  ReadingNeed,
  ReadingPace,
} from "./types";

const giftTargetAges: Record<GiftAge, number> = {
  "13_17": 16,
  "18_25": 22,
  "26_40": 33,
  "41_60": 50,
  "60_plus": 65,
};

const childTargetAges: Record<ChildAge, number> = {
  "3_5": 5,
  "6_8": 7,
  "9_12": 10,
  "13_15": 14,
  "16_17": 17,
};

function giftNeed(answers: RecommendationAnswers): ReadingNeed {
  if (answers.giftStyle === "surprise") return "out_of_routine";
  if (answers.giftRelationship === "partner" || answers.giftOccasion === "celebration") return "emotional";
  if (answers.giftRelationship === "colleague" || answers.giftRelationship === "teacher") return "learning";
  return "captivating";
}

function giftPace(answers: RecommendationAnswers): ReadingPace {
  if (answers.giftReadingHabit === "rare") return "fast";
  if (answers.giftReadingHabit === "occasional") return "balanced";
  return "any";
}

function giftLength(answers: RecommendationAnswers): ReadingLength {
  if (answers.giftReadingHabit === "rare") return "under_200";
  if (answers.giftReadingHabit === "occasional") return "200_350";
  return "any";
}

function giftDealBreakers(answers: RecommendationAnswers): DealBreaker[] {
  if (answers.giftStyle === "safe") return ["explicit_violence", "heavy_topics", "ambiguous_ending"];
  if (answers.giftStyle === "balanced") return ["explicit_violence"];
  return ["none"];
}

function childNeed(answers: RecommendationAnswers): ReadingNeed {
  if (answers.childGoal === "learning") return "learning";
  if (answers.childGoal === "emotional") return "emotional";
  if (answers.childGoal === "confidence") return "relaxing";
  return "captivating";
}

function childPace(answers: RecommendationAnswers): ReadingPace {
  return answers.childReadingLevel === "beginner" ? "fast" : "any";
}

function childLength(answers: RecommendationAnswers): ReadingLength {
  if (["3_5", "6_8"].includes(answers.childAge ?? "")) return "under_200";
  if (answers.childReadingLevel === "beginner") return "under_200";
  if (answers.childReadingLevel === "independent") return "200_350";
  return "any";
}

function childDealBreakers(sensitivities: ChildSensitivity[]): DealBreaker[] {
  if (sensitivities.includes("none")) return ["none"];
  const values = new Set<DealBreaker>();
  if (sensitivities.includes("violence")) values.add("explicit_violence");
  if (sensitivities.includes("scary") || sensitivities.includes("grief")) values.add("heavy_topics");
  if (sensitivities.includes("complex")) values.add("technical_explanations");
  return values.size ? [...values] : ["none"];
}

export function recommendationEngineInputForBranch(
  branch: RecommendationBranch,
  answers: RecommendationAnswers,
  candidates: RecommendationCandidate[],
): RecommendationEngineInput {
  if (branch === "gift") {
    return {
      answers: {
        need: giftNeed(answers),
        genres: answers.giftInterests!,
        pace: giftPace(answers),
        length: giftLength(answers),
        likedBookId: null,
        dealBreakers: giftDealBreakers(answers),
      },
      context: {
        branch,
        targetAge: giftTargetAges[answers.giftAge!],
        relationship: answers.giftRelationship!,
        occasion: answers.giftOccasion!,
        readingHabit: answers.giftReadingHabit!,
        style: answers.giftStyle!,
      },
      candidates,
    };
  }

  if (branch === "child") {
    return {
      answers: {
        need: childNeed(answers),
        genres: answers.childInterests!,
        pace: childPace(answers),
        length: childLength(answers),
        likedBookId: null,
        dealBreakers: childDealBreakers(answers.childSensitivities!),
      },
      context: {
        branch,
        targetAge: childTargetAges[answers.childAge!],
        readingLevel: answers.childReadingLevel!,
        readingMode: answers.childReadingMode!,
        goal: answers.childGoal!,
      },
      candidates,
    };
  }

  return {
    answers: {
      need: answers.need!,
      genres: answers.genres!,
      pace: answers.pace!,
      length: answers.length!,
      likedBookId: answers.likedBookId ?? null,
      dealBreakers: answers.dealBreakers!,
    },
    context: { branch: "self" },
    candidates,
  };
}
