import { bookImportHeaders } from "@/domain/editorial/book-import-service";
import { requirePermission } from "@/lib/auth/principal";

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET() {
  await requirePermission("books.create");
  const example = [
    "exemplu-001",
    "Cartea exemplu",
    "Autor Exemplu",
    "autor-exemplu",
    "",
    "",
    "",
    "Rezumat fără spoilere.",
    "O prezentare scurtă a cărții.",
    "Motivul principal pentru care merită citită.",
    "Poate avea un ritm lent",
    "Personaje bine construite|Atmosferă memorabilă",
    "Ediția I",
    "",
    "9786060000000",
    "Editura Exemplu",
    "2026",
    "ro",
    "320",
    "Ficțiune",
    "Identitate|Familie",
    "Captivant|Emoționant",
    "Adulți",
    "exemplu-001",
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
