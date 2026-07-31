"use server";

import { revalidatePath } from "next/cache";

import { importBooksFromCsv } from "@/domain/editorial/book-import-service";
import type { BookImportActionState } from "@/domain/editorial/book-import-types";
import { requirePermission } from "@/lib/auth/principal";

export async function importBooksAction(_state: BookImportActionState, formData: FormData): Promise<BookImportActionState> {
  const principal = await requirePermission("books.create");
  const file = formData.get("file");
  if (!(file instanceof File)) return { status: "error", message: "Alege fișierul CSV.", imported: [], skipped: [], errors: [] };
  const result = await importBooksFromCsv(file, principal.id);
  if (result.imported.length) {
    revalidatePath("/admin/books");
    revalidatePath("/admin/readiness");
    revalidatePath("/carti");
    revalidatePath("/");
  }
  return result;
}
