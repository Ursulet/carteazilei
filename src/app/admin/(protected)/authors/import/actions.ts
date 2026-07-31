"use server";

import { revalidatePath } from "next/cache";

import { importAuthorsFromCsv } from "@/domain/editorial/author-import-service";
import type { AuthorImportActionState } from "@/domain/editorial/author-import-types";
import { requireMutationAccess } from "@/lib/auth/principal";

export async function importAuthorsAction(_state: AuthorImportActionState, formData: FormData): Promise<AuthorImportActionState> {
  const principal = await requireMutationAccess("authors");
  const file = formData.get("file");
  if (!(file instanceof File)) return { status: "error", message: "Alege fișierul CSV.", imported: [], skipped: [], errors: [] };
  const result = await importAuthorsFromCsv(file, principal.id);
  if (result.imported.length) {
    revalidatePath("/admin/authors");
    revalidatePath("/admin/books/import");
    revalidatePath("/autori");
  }
  return result;
}
