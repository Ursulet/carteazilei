import type { Metadata } from "next";

import { BookForm } from "@/components/admin/book-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getBookFormOptions } from "@/db/queries/admin-editorial";
import { requireSectionAccess } from "@/lib/auth/principal";

import { createBookAction } from "../actions";

export const metadata: Metadata = { title: "Carte nouă" };

export default async function NewBookPage() {
  await requireSectionAccess("books");
  const options = await getBookFormOptions();
  return <><AdminPageHeader eyebrow="Catalog" title="Carte nouă" description="Construiește fișa editorială, apoi folosește checklistul înainte de publicare." /><BookForm action={createBookAction} options={options} /></>;
}
