import type { ReadingNeed } from "./types";

type NeedTaxonomySignals = {
  genres: readonly string[];
  moods: readonly string[];
  themes: readonly string[];
};

/**
 * Semnalele de mai jos completeaza potrivirea exacta a genului ales in quiz.
 * Ele nu limiteaza taxonomiile acceptate: orice gen activ nou functioneaza
 * automat prin ID; lista ofera doar context suplimentar pentru nevoia de lectura.
 */
export const recommendationNeedTaxonomySignals: Record<
  ReadingNeed,
  NeedTaxonomySignals
> = {
  captivating: {
    genres: [
      "actiune-si-aventura",
      "benzi-desenate-si-romane-grafice",
      "carti-pentru-copii",
      "crime",
      "distopie",
      "fantasy",
      "fictiune",
      "fictiune-istorica",
      "horror",
      "literatura-contemporana",
      "mister",
      "science-fiction",
      "thriller",
      "true-crime",
    ],
    moods: ["captivant"],
    themes: [],
  },
  relaxing: {
    genres: [
      "calatorii",
      "carti-pentru-copii",
      "gastronomie",
      "poezie",
      "romance",
      "umor-si-satira",
    ],
    moods: ["relaxant", "optimist", "inspirational"],
    themes: [],
  },
  thought_provoking: {
    genres: [
      "distopie",
      "eseu",
      "filosofie",
      "fictiune-istorica",
      "istorie",
      "literatura-clasica",
      "politica-si-societate",
      "psihologie",
      "stiinta",
    ],
    moods: ["provocator"],
    themes: ["anxietate", "identitate", "leadership", "putere", "sens"],
  },
  learning: {
    genres: [
      "arta-si-design",
      "biografie",
      "business",
      "calatorii",
      "dezvoltare-personala",
      "economie-si-finante",
      "eseu",
      "filosofie",
      "gastronomie",
      "istorie",
      "memorii",
      "non-fictiune",
      "parenting",
      "politica-si-societate",
      "psihologie",
      "religie-si-spiritualitate",
      "sanatate-si-wellbeing",
      "stiinta",
      "tehnologie",
      "true-crime",
    ],
    moods: ["inspirational"],
    themes: ["leadership", "productivitate"],
  },
  emotional: {
    genres: [
      "biografie",
      "dramaturgie",
      "literatura-contemporana",
      "memorii",
      "poezie",
      "romance",
    ],
    moods: ["emotionant"],
    themes: ["anxietate", "doliu", "familie", "identitate", "sens"],
  },
  out_of_routine: {
    genres: [
      "actiune-si-aventura",
      "benzi-desenate-si-romane-grafice",
      "calatorii",
      "distopie",
      "fantasy",
      "horror",
      "mister",
      "science-fiction",
    ],
    moods: ["captivant", "intunecat", "provocator"],
    themes: ["identitate", "putere", "sens"],
  },
};
