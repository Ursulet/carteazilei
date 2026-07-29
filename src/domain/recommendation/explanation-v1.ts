import type {
  RecommendationExplanationSnapshot,
  ScoredRecommendationCandidate,
} from "./engine-types";
import type { SelfRecommendationAnswers } from "./types";

/** Derivă eticheta publică din benzi interne, fără procent pseudo-științific. */
function confidenceLabel(score: number): RecommendationExplanationSnapshot["confidenceLabel"] {
  if (score >= 78) return "Potrivire excelentă";
  if (score >= 62) return "Potrivire foarte bună";
  return "Potrivire bună";
}

/** Produce motivul principal într-un limbaj determinist pentru fiecare nevoie. */
function needReason(need: NonNullable<SelfRecommendationAnswers["need"]>) {
  const reasons = {
    captivating: "Ai cerut o carte care să te captiveze, iar profilul editorial susține o lectură care înaintează și menține interesul.",
    relaxing: "Ai căutat o lectură care să te relaxeze, iar semnalele editoriale indică o experiență mai calmă și mai puțin apăsătoare.",
    thought_provoking: "Ai vrut o carte care să te facă să gândești, iar profilul ei favorizează ideile, întrebările și profunzimea.",
    learning: "Ai vrut să înveți ceva, iar cartea are semnale editoriale de conținut practic, explicativ sau documentar.",
    emotional: "Ai căutat impact emoțional, iar analiza și profilul lecturii susțin o miză umană puternică.",
    out_of_routine: "Ai vrut să ieși din rutină, iar cartea propune o experiență suficient de distinctă prin lume, idei sau complexitate.",
  } as const;
  return reasons[need];
}

/** Traduce contribuțiile de scoring în motive publice care pot fi auditate. */
function contributionReason(
  scored: ScoredRecommendationCandidate,
  answers: Required<Omit<SelfRecommendationAnswers, "likedBookId">> & {
    likedBookId?: string | null;
  },
  component: ScoredRecommendationCandidate["contributions"][number]["component"],
) {
  const candidate = scored.candidate;
  switch (component) {
    case "need":
      return needReason(answers.need);
    case "genre": {
      const matches = candidate.genres.filter((genre) => answers.genres.includes(genre.id));
      return matches.length
        ? `Ai ales ${matches.map((genre) => genre.name).join(" și ")}, iar cartea este încadrată editorial în această direcție.`
        : null;
    }
    case "pace": {
      const labels = {
        slow_atmospheric: "un ritm lent și atmosferic",
        balanced: "un ritm echilibrat",
        fast: "un ritm rapid",
        any: "un ritm flexibil",
      } as const;
      return `Ai preferat ${labels[answers.pace]}, iar profilul de lectură al cărții este apropiat de această alegere.`;
    }
    case "length":
      return candidate.edition.pageCount
        ? `Cu aproximativ ${candidate.edition.pageCount} de pagini, cartea se apropie de timpul de lectură pe care l-ai indicat.`
        : null;
    case "reference": {
      const relation = [...candidate.referenceRelations].sort(
        (left, right) => right.strength - left.strength,
      )[0];
      return relation ? `Legătura editorială cu titlul tău de referință: ${relation.reason}` : null;
    }
    case "editorial_confidence":
      return "Fișa editorială are suficiente date verificate pentru ca potrivirea să nu se bazeze pe o coincidență de etichete.";
    case "freshness":
      return `Analiza editorială o descrie astfel: ${candidate.shortVerdict}`;
    case "audience":
      return null;
  }
}

/** Selectează exact trei motive distincte și o rezervă editorială reală. */
export function buildRecommendationExplanation(
  scored: ScoredRecommendationCandidate,
  answers: Required<Omit<SelfRecommendationAnswers, "likedBookId">> & {
    likedBookId?: string | null;
  },
): RecommendationExplanationSnapshot {
  const orderedComponents = [...scored.contributions]
    .filter((contribution) => Boolean(contribution.reasonCode))
    .sort((left, right) => right.points - left.points)
    .map((contribution) => contribution.component);
  const reasonCandidates = [
    ...orderedComponents.map((component) => contributionReason(scored, answers, component)),
    `Analiza editorială o descrie astfel: ${scored.candidate.shortVerdict}`,
    "Cartea trece pragul intern de completitudine și încredere editorială pentru recomandări personalizate.",
  ];
  const unique = [...new Set(reasonCandidates.filter((reason): reason is string => Boolean(reason?.trim())))];
  const reasons = unique.slice(0, 3);
  while (reasons.length < 3) {
    reasons.push("Potrivirea folosește numai semnalele editoriale disponibile și validate pentru această carte.");
  }
  return {
    schemaVersion: 1,
    confidenceLabel: confidenceLabel(scored.score),
    reasons: [reasons[0]!, reasons[1]!, reasons[2]!],
    caveat: scored.candidate.review.caveats[0]!,
  };
}
