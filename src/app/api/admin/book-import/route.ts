import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { importBooksFromFile } from "@/domain/editorial/book-import-service";
import { requirePermission } from "@/lib/auth/principal";

export async function POST(request: Request) {
  const principal = await requirePermission("books.create");
  await requirePermission("books.update");
  await requirePermission("authors.manage");
  await requirePermission("media.manage");
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ status: "error", message: "Alege fișierul CSV sau JSON.", imported: [], skipped: [], errors: [] }, { status: 400 });
  }

  const validateOnly = new URL(request.url).searchParams.get("mode") === "validate";
  const result = await importBooksFromFile(file, principal.id, { validateOnly });
  if (!validateOnly && result.imported.length) {
    revalidatePath("/admin/authors");
    revalidatePath("/admin/books");
    revalidatePath("/admin/readiness");
    revalidatePath("/carti");
    revalidatePath("/autori");
    revalidatePath("/");
  }
  return NextResponse.json(result, { status: 200 });
}
