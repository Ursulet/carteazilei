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
  return <><AdminPageHeader eyebrow="Catalog" title="Carte nouă" description="Completează datele disponibile și încarcă opțional coperta direct din formular. Cartea se salvează ca ciornă; checklistul este verificat numai la publicare." /><BookForm action={createBookAction} options={options} /></>;
}
