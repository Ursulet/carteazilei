import { bookImportHeaders } from "@/domain/editorial/book-import-service";
import { requirePermission } from "@/lib/auth/principal";

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

const exampleAuthor = {
  id: "author-exemplu",
  name: "Autor Exemplu",
  slug: "autor-exemplu",
  bio: "Biografie scurtă.",
  verified_facts: "Informații verificate despre autor.",
  source_notes: "Sursele editorului.",
};

const exampleBook = {
  id: "book-exemplu-001",
  title: "Cartea exemplu",
  original_title: "",
  slug: "cartea-exemplu",
  author_id: "author-exemplu",
  cover: {
    id: "image-book-exemplu-001",
    alt_text: "Coperta cărții Cartea exemplu de Autor Exemplu",
  },
  isbn10: "",
  isbn13: "9786060000000",
  publication_year: 2026,
  language: "ro",
  page_count: 320,
  editorial: {
    summary: "Rezumat fără spoilere.",
    verdict: "O prezentare scurtă a cărții.",
    why_read: "Motivul principal pentru care merită citită.",
    why_not: "Poate avea un ritm lent.",
    strengths: ["Personaje bine construite", "Atmosferă memorabilă"],
    caveats: ["Ritm lent în prima parte"],
    confidence: 70,
  },
  taxonomy: {
    genres: ["Ficțiune"],
    themes: ["Identitate", "Familie"],
    moods: ["Captivant", "Emoționant"],
    audiences: ["Adulți"],
  },
  trait_scores: [
    { code: "ambiguity", score: null, confidence: null },
    { code: "complexity", score: null, confidence: null },
    { code: "practical_density", score: null, confidence: null },
    { code: "emotional_intensity", score: null, confidence: null },
    { code: "philosophical_depth", score: null, confidence: null },
    { code: "pace", score: null, confidence: null },
    { code: "romance", score: null, confidence: null },
    { code: "humor", score: null, confidence: null },
    { code: "violence", score: null, confidence: null },
    { code: "world_building", score: null, confidence: null },
  ],
  seo: {
    title: "",
    description: "",
    canonical: "",
    indexable: false,
  },
};

export async function GET(request: Request) {
  await requirePermission("books.create");
  const format = new URL(request.url).searchParams.get("format");
  if (format === "json") {
    const json = JSON.stringify({ version: 1, authors: [exampleAuthor], books: [exampleBook] }, null, 2);
    return new Response(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="model-import-carti.json"',
        "Cache-Control": "private, no-store",
      },
    });
  }

  const example = [
    "book-exemplu-001",
    "Cartea exemplu",
    "",
    "cartea-exemplu",
    "author-exemplu",
    "Autor Exemplu",
    "autor-exemplu",
    "Biografie scurtă.",
    "Informații verificate despre autor.",
    "Sursele editorului.",
    "image-book-exemplu-001",
    "Coperta cărții Cartea exemplu de Autor Exemplu",
    "",
    "9786060000000",
    "2026",
    "ro",
    "320",
    "Rezumat fără spoilere.",
    "O prezentare scurtă a cărții.",
    "Motivul principal pentru care merită citită.",
    "Poate avea un ritm lent.",
    "Personaje bine construite|Atmosferă memorabilă",
    "Ritm lent în prima parte",
    "70",
    "Ficțiune",
    "Identitate|Familie",
    "Captivant|Emoționant",
    "Adulți",
    "ambiguity::|complexity::|practical_density::|emotional_intensity::|philosophical_depth::|pace::|romance::|humor::|violence::|world_building::",
    "",
    "",
    "",
    "nu",
  ];
  const csv = `\uFEFFsep=;\r\n${bookImportHeaders.map(csvCell).join(";")}\r\n${example.map(csvCell).join(";")}\r\n`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="model-import-carti.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
