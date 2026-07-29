import type {
  RecommendationCandidate,
  RecommendationEngineInput,
  RecommendationEngineResult,
  ScoreContribution,
  ScoredRecommendationCandidate,
} from "./engine-types";
import type {
  DealBreaker,
  ReadingLength,
  ReadingNeed,
  ReadingPace,
} from "./types";
import { buildRecommendationExplanation } from "./explanation-v1";

export const RECOMMENDATION_ALGORITHM_VERSION = "recommendation-v1";
export const MINIMUM_RECOMMENDATION_SCORE = 35;

export const recommendationV1Weights = {
  need: 26,
  genre: 16,
  pace: 12,
  length: 8,
  reference: 18,
  audience: 8,
  editorial_confidence: 8,
  freshness: 4,
} as const;

/** Limitează o valoare numerică la intervalul inclusiv dat. */
function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

/** Rotunjește scorurile persistate pentru rezultate stabile și lizibile. */
function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

/** Normalizează un trait editorial și îi reduce influența când încrederea este mică. */
function traitFit(candidate: RecommendationCandidate, code: string) {
  const trait = candidate.traits.find((item) => item.code === code);
  if (!trait) return null;
  const confidenceFactor = 0.5 + (trait.confidence / 100) * 0.5;
  return clamp((trait.score / 100) * confidenceFactor);
}

/** Returnează traitul brut numai când evaluarea editorială are încredere suficientă. */
function reliableTrait(candidate: RecommendationCandidate, code: string) {
  const trait = candidate.traits.find((item) => item.code === code);
  return trait && trait.confidence >= 50 ? trait.score : null;
}

/** Transformă intensitatea unei stări editoriale publicate într-o valoare 0–1. */
function moodFit(candidate: RecommendationCandidate, slug: string) {
  const mood = candidate.moods.find((item) => item.slug === slug);
  return mood ? clamp(mood.strength / 100) : null;
}

/** Combină semnalele de stare și trait pentru nevoia principală a cititorului. */
function primaryNeedFit(candidate: RecommendationCandidate, need: ReadingNeed) {
  const average = (values: Array<number | null>, fallback = 0) => {
    const available = values.filter((value): value is number => value !== null);
    return available.length
      ? available.reduce((sum, value) => sum + value, 0) / available.length
      : fallback;
  };

  switch (need) {
    case "captivating":
      return average([moodFit(candidate, "captivant"), traitFit(candidate, "pace")]);
    case "relaxing": {
      const calm = moodFit(candidate, "relaxant");
      const violence = traitFit(candidate, "violence");
      const emotional = traitFit(candidate, "emotional_intensity");
      return average([
        calm,
        violence === null ? null : 1 - violence,
        emotional === null ? null : 1 - emotional * 0.65,
      ]);
    }
    case "thought_provoking":
      return average([
        moodFit(candidate, "provocator"),
        traitFit(candidate, "philosophical_depth"),
        traitFit(candidate, "complexity"),
      ]);
    case "learning":
      return average([
        traitFit(candidate, "practical_density"),
        candidate.genres.some((genre) =>
          ["istorie", "business", "psihologie", "dezvoltare-personala", "parenting", "memorii"].includes(genre.slug),
        )
          ? 0.85
          : null,
      ]);
    case "emotional":
      return average([
        moodFit(candidate, "emotionant"),
        traitFit(candidate, "emotional_intensity"),
      ]);
    case "out_of_routine":
      return average([
        moodFit(candidate, "provocator"),
        traitFit(candidate, "world_building"),
        traitFit(candidate, "complexity"),
      ]);
  }
}

/** Calculează potrivirea de gen fără a penaliza disproporționat o selecție de trei genuri. */
function genreFit(candidate: RecommendationCandidate, selectedGenreIds: string[]) {
  const matched = candidate.genres.filter((genre) => selectedGenreIds.includes(genre.id));
  if (!matched.length) return { fit: 0, matched };
  return {
    fit: clamp(0.65 + 0.35 * (matched.length / selectedGenreIds.length)),
    matched,
  };
}

/** Transformă preferința de ritm într-o distanță față de traitul editorial `pace`. */
function paceFit(candidate: RecommendationCandidate, pace: Exclude<ReadingPace, "any">) {
  const value = traitFit(candidate, "pace");
  if (value === null) return 0;
  const targets: Record<Exclude<ReadingPace, "any">, number> = {
    slow_atmospheric: 0.2,
    balanced: 0.5,
    fast: 0.85,
  };
  return clamp(1 - Math.abs(value - targets[pace]) / 0.75);
}

/** Evaluează lungimea prin intervale explicite și zone-tampon apropiate. */
function lengthFit(candidate: RecommendationCandidate, length: Exclude<ReadingLength, "any">) {
  const pages = candidate.edition.pageCount;
  if (!pages) return 0;
  switch (length) {
    case "under_200": return pages <= 200 ? 1 : pages <= 250 ? 0.5 : 0;
    case "200_350": return pages >= 200 && pages <= 350 ? 1 : pages >= 150 && pages <= 425 ? 0.5 : 0;
    case "350_500": return pages >= 350 && pages <= 500 ? 1 : pages >= 275 && pages <= 600 ? 0.5 : 0;
    case "over_500": return pages > 500 ? 1 : pages >= 425 ? 0.5 : 0;
  }
}

/** Selectează cea mai puternică relație editorială aprobată cu referința. */
function referenceFit(candidate: RecommendationCandidate) {
  const relation = [...candidate.referenceRelations].sort(
    (left, right) => right.strength - left.strength,
  )[0];
  return { fit: relation ? relation.strength / 100 : 0, relation };
}

/** Recompensează moderat recența revizuirii editoriale, fără semnal de popularitate. */
function freshnessFit(candidate: RecommendationCandidate) {
  const ageMonths =
    (Date.now() - candidate.editorialUpdatedAt.getTime()) /
    (30.44 * 24 * 60 * 60 * 1_000);
  if (ageMonths <= 12) return 1;
  if (ageMonths <= 36) return 0.75;
  return 0.5;
}

/** Detectează incompatibilități ferme numai din semnale editoriale suficient de sigure. */
function hardConflictCodes(candidate: RecommendationCandidate, dealBreakers: DealBreaker[]) {
  if (dealBreakers.includes("none")) return [];
  const conflicts: string[] = [];
  const romance = reliableTrait(candidate, "romance");
  const violence = reliableTrait(candidate, "violence");
  const pace = reliableTrait(candidate, "pace");
  const complexity = reliableTrait(candidate, "complexity");
  const practical = reliableTrait(candidate, "practical_density");
  const ambiguity = reliableTrait(candidate, "ambiguity");
  const darkMood = candidate.moods.find((mood) => mood.slug === "intunecat")?.strength;
  const heavyTheme = candidate.themes.some((theme) => ["doliu", "anxietate"].includes(theme.slug));

  if (dealBreakers.includes("too_much_romance") && romance !== null && romance >= 70) conflicts.push("HARD_CONFLICT_ROMANCE");
  if (dealBreakers.includes("explicit_violence") && violence !== null && violence >= 65) conflicts.push("HARD_CONFLICT_VIOLENCE");
  if (dealBreakers.includes("heavy_topics") && ((darkMood ?? 0) >= 70 || heavyTheme)) conflicts.push("HARD_CONFLICT_HEAVY_TOPICS");
  if (dealBreakers.includes("slow_burn") && pace !== null && pace <= 30) conflicts.push("HARD_CONFLICT_SLOW_BURN");
  if (dealBreakers.includes("technical_explanations") && complexity !== null && practical !== null && complexity >= 80 && practical >= 65) conflicts.push("HARD_CONFLICT_TECHNICAL");
  if (dealBreakers.includes("ambiguous_ending") && ambiguity !== null && ambiguity >= 70) conflicts.push("HARD_CONFLICT_AMBIGUITY");
  return conflicts;
}

/** Aplică penalizări declarative pentru conflicte moderate care nu justifică eliminarea. */
function softConflictPenalties(candidate: RecommendationCandidate, dealBreakers: DealBreaker[]) {
  if (dealBreakers.includes("none")) return [];
  const penalties: Array<{ points: number; reasonCode: string }> = [];
  const romance = reliableTrait(candidate, "romance");
  const violence = reliableTrait(candidate, "violence");
  const pace = reliableTrait(candidate, "pace");
  const complexity = reliableTrait(candidate, "complexity");
  const ambiguity = reliableTrait(candidate, "ambiguity");
  const darkMood = candidate.moods.find((mood) => mood.slug === "intunecat")?.strength;

  if (dealBreakers.includes("too_much_romance") && romance !== null && romance >= 50) penalties.push({ points: 8, reasonCode: "SOFT_CONFLICT_ROMANCE" });
  if (dealBreakers.includes("explicit_violence") && violence !== null && violence >= 45) penalties.push({ points: 10, reasonCode: "SOFT_CONFLICT_VIOLENCE" });
  if (dealBreakers.includes("heavy_topics") && (darkMood ?? 0) >= 50) penalties.push({ points: 8, reasonCode: "SOFT_CONFLICT_HEAVY_TOPICS" });
  if (dealBreakers.includes("slow_burn") && pace !== null && pace <= 45) penalties.push({ points: 8, reasonCode: "SOFT_CONFLICT_SLOW_BURN" });
  if (dealBreakers.includes("technical_explanations") && complexity !== null && complexity >= 65) penalties.push({ points: 7, reasonCode: "SOFT_CONFLICT_TECHNICAL" });
  if (dealBreakers.includes("ambiguous_ending") && ambiguity !== null && ambiguity >= 50) penalties.push({ points: 7, reasonCode: "SOFT_CONFLICT_AMBIGUITY" });
  return penalties;
}

/** Adaugă reason codes pozitive când un deal-breaker este editorial sub prag. */
function avoidanceReasonCodes(candidate: RecommendationCandidate, dealBreakers: DealBreaker[]) {
  if (dealBreakers.includes("none")) return [];
  const codes: string[] = [];
  const rules: Array<[DealBreaker, string, number, string]> = [
    ["too_much_romance", "romance", 30, "AVOID_ROMANCE_LOW"],
    ["explicit_violence", "violence", 30, "AVOID_VIOLENCE_LOW"],
    ["slow_burn", "pace", 55, "AVOID_SLOW_BURN"],
    ["technical_explanations", "complexity", 45, "AVOID_TECHNICAL_LOW"],
    ["ambiguous_ending", "ambiguity", 30, "AVOID_AMBIGUITY_LOW"],
  ];
  for (const [dealBreaker, traitCode, threshold, reasonCode] of rules) {
    const value = reliableTrait(candidate, traitCode);
    if (!dealBreakers.includes(dealBreaker) || value === null) continue;
    const avoids = dealBreaker === "slow_burn" ? value >= threshold : value <= threshold;
    if (avoids) codes.push(reasonCode);
  }
  const darkMood = candidate.moods.find((mood) => mood.slug === "intunecat")?.strength;
  if (dealBreakers.includes("heavy_topics") && darkMood !== undefined && darkMood <= 30) codes.push("AVOID_HEAVY_TOPICS_LOW");
  return codes;
}

/** Convertește slugurile în reason codes stabile, independente de textul public. */
function codeFragment(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

/** Calculează un singur candidat folosind numai componentele disponibile global. */
function scoreCandidate(
  candidate: RecommendationCandidate,
  input: RecommendationEngineInput,
  referenceAvailable: boolean,
): ScoredRecommendationCandidate | null {
  if (hardConflictCodes(candidate, input.answers.dealBreakers).length) return null;

  const contributions: ScoreContribution[] = [];
  const activeWeights: number[] = [
    recommendationV1Weights.need,
    recommendationV1Weights.editorial_confidence,
    recommendationV1Weights.freshness,
  ];
  const need = primaryNeedFit(candidate, input.answers.need);
  contributions.push({
    component: "need",
    points: need * recommendationV1Weights.need,
    reasonCode:
      need >= 0.45
        ? `MATCH_PRIMARY_NEED_${codeFragment(input.answers.need)}`
        : undefined,
  });

  if (!input.answers.genres.includes("any")) {
    activeWeights.push(recommendationV1Weights.genre);
    const genre = genreFit(candidate, input.answers.genres);
    contributions.push({
      component: "genre",
      points: genre.fit * recommendationV1Weights.genre,
      reasonCode: genre.matched[0] ? `MATCH_GENRE_${codeFragment(genre.matched[0].slug)}` : undefined,
    });
  }
  if (input.answers.pace !== "any") {
    activeWeights.push(recommendationV1Weights.pace);
    const fit = paceFit(candidate, input.answers.pace);
    contributions.push({ component: "pace", points: fit * recommendationV1Weights.pace, reasonCode: fit >= 0.55 ? `MATCH_${codeFragment(input.answers.pace)}_PACE` : undefined });
  }
  if (input.answers.length !== "any") {
    activeWeights.push(recommendationV1Weights.length);
    const fit = lengthFit(candidate, input.answers.length);
    contributions.push({ component: "length", points: fit * recommendationV1Weights.length, reasonCode: fit >= 0.5 ? `MATCH_LENGTH_${codeFragment(input.answers.length)}` : undefined });
  }
  if (referenceAvailable) {
    activeWeights.push(recommendationV1Weights.reference);
    const reference = referenceFit(candidate);
    contributions.push({ component: "reference", points: reference.fit * recommendationV1Weights.reference, reasonCode: reference.relation ? `MATCH_REFERENCE_${codeFragment(reference.relation.type)}` : undefined });
  }

  contributions.push({
    component: "editorial_confidence",
    points: (candidate.editorialConfidence / 100) * recommendationV1Weights.editorial_confidence,
    reasonCode: candidate.editorialConfidence >= 75 ? "EDITORIAL_CONFIDENCE_HIGH" : "EDITORIAL_CONFIDENCE_SUFFICIENT",
  });
  contributions.push({
    component: "freshness",
    points: freshnessFit(candidate) * recommendationV1Weights.freshness,
    reasonCode: "EDITORIAL_FRESHNESS",
  });

  const activeMaximum = activeWeights.reduce((sum, weight) => sum + weight, 0);
  const earned = contributions.reduce((sum, contribution) => sum + contribution.points, 0);
  const penalties = softConflictPenalties(candidate, input.answers.dealBreakers);
  const penaltyTotal = penalties.reduce((sum, penalty) => sum + penalty.points, 0);
  const score = roundScore(clamp((earned / activeMaximum) * 100 - penaltyTotal, 0, 100));
  const reasonCodes = [
    ...contributions.flatMap((item) => (item.reasonCode ? [item.reasonCode] : [])),
    ...avoidanceReasonCodes(candidate, input.answers.dealBreakers),
    ...penalties.map((penalty) => penalty.reasonCode),
  ];
  return { candidate, score, contributions, penalties, reasonCodes };
}

/** Sortează stabil candidații fără popularitate: scor, încredere editorială, titlu. */
function stableScoreOrder(candidates: ScoredRecommendationCandidate[]) {
  return [...candidates].sort(
    (left, right) =>
      right.score - left.score ||
      right.candidate.editorialConfidence - left.candidate.editorialConfidence ||
      left.candidate.title.localeCompare(right.candidate.title, "ro"),
  );
}

/**
 * Alege progresiv maximum trei rezultate. Preferă autori și genuri principale
 * diferite, apoi relaxează numai genul și, în ultimă instanță, autorul.
 * Seria/subgenul nu sunt modelate încă și nu sunt fabricate din titlu.
 */
function selectDiverseTopThree(candidates: ScoredRecommendationCandidate[]) {
  const ordered = stableScoreOrder(candidates).filter(
    (candidate) => candidate.score >= MINIMUM_RECOMMENDATION_SCORE,
  );
  const selected: ScoredRecommendationCandidate[] = [];
  while (selected.length < 3 && selected.length < ordered.length) {
    const selectedIds = new Set(selected.map((item) => item.candidate.id));
    const authorIds = new Set(selected.map((item) => item.candidate.author.id));
    const primaryGenres = new Set(
      selected.flatMap((item) =>
        item.candidate.genres.filter((genre) => genre.isPrimary).map((genre) => genre.id),
      ),
    );
    const remaining = ordered.filter((item) => !selectedIds.has(item.candidate.id));
    const strict = remaining.find(
      (item) =>
        !authorIds.has(item.candidate.author.id) &&
        !item.candidate.genres.some((genre) => genre.isPrimary && primaryGenres.has(genre.id)),
    );
    const authorDiverse = remaining.find((item) => !authorIds.has(item.candidate.author.id));
    const next = strict ?? authorDiverse ?? remaining[0];
    if (!next) break;
    selected.push(next);
  }
  return selected;
}

/** Rulează motorul V1, normalizează semnalele absente și construiește snapshoturile. */
export function runRecommendationEngineV1(
  input: RecommendationEngineInput,
): RecommendationEngineResult[] {
  const referenceAvailable = Boolean(
    input.answers.likedBookId &&
      input.candidates.some((candidate) => candidate.referenceRelations.length > 0),
  );
  const scored = input.candidates
    .map((candidate) => scoreCandidate(candidate, input, referenceAvailable))
    .filter((candidate): candidate is ScoredRecommendationCandidate => candidate !== null);
  return selectDiverseTopThree(scored).map((candidate, index) => ({
    ...candidate,
    rank: index + 1,
    explanation: buildRecommendationExplanation(candidate, input.answers),
  }));
}
