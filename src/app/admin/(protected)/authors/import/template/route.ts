import { authorImportHeaders } from "@/domain/editorial/author-import-service";
import { requireMutationAccess } from "@/lib/auth/principal";

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET() {
  await requireMutationAccess("authors");
  const example = [
    "autor-exemplu",
    "Autor Exemplu",
    "autor-exemplu",
    "Biografie scurtă, verificată editorial.",
    "Informații biografice verificate.",
    "Sursele și observațiile editorului.",
  ];
  const csv = `\uFEFFsep=;\r\n${authorImportHeaders.map(csvCell).join(";")}\r\n${example.map(csvCell).join(";")}\r\n`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="model-import-autori.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
