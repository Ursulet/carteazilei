import type { PublishingGateItem } from "./action-state";

export const BOOK_PUBLISHING_CONFIDENCE_THRESHOLD = 60;

export type BookPublishingSnapshot = {
  title?: string | null;
  slug?: string | null;
  authorId?: string | null;
  activeEdition: boolean;
  coverAlt?: string | null;
  verdict?: string | null;
  summary?: string | null;
  caveats: readonly string[];
  genreIds: readonly string[];
  editorialConfidence: number;
  editorId?: string | null;
};

export function evaluateBookPublishingGate(
  snapshot: BookPublishingSnapshot,
): PublishingGateItem[] {
  return [
    { key: "title", label: "Titlu completat", passed: Boolean(snapshot.title?.trim()) },
    { key: "slug", label: "Slug valid", passed: Boolean(snapshot.slug?.trim()) },
    { key: "author", label: "Autor atribuit", passed: Boolean(snapshot.authorId) },
    { key: "edition", label: "Cel puțin o ediție activă", passed: snapshot.activeEdition },
    {
      key: "cover",
      label: "Copertă cu text alternativ",
      passed: Boolean(snapshot.coverAlt?.trim()),
    },
    { key: "verdict", label: "Verdict editorial", passed: Boolean(snapshot.verdict?.trim()) },
    { key: "summary", label: "Rezumat fără spoilere", passed: Boolean(snapshot.summary?.trim()) },
    { key: "caveat", label: "Cel puțin o rezervă editorială", passed: snapshot.caveats.length > 0 },
    { key: "genre", label: "Cel puțin un gen", passed: snapshot.genreIds.length > 0 },
    {
      key: "confidence",
      label: `Nivel de verificare de minimum ${BOOK_PUBLISHING_CONFIDENCE_THRESHOLD}%`,
      passed: snapshot.editorialConfidence >= BOOK_PUBLISHING_CONFIDENCE_THRESHOLD,
    },
    { key: "editor", label: "Editor atribuit", passed: Boolean(snapshot.editorId) },
  ];
}

export function missingPublishingLabels(items: readonly PublishingGateItem[]) {
  return items.filter((item) => !item.passed).map((item) => item.label);
}
