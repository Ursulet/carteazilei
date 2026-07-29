import type { Metadata } from "next";

import { EditorialListForm } from "@/components/admin/editorial-list-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getSeoHubBookOptions } from "@/db/queries/admin-seo-hubs";
import { requireSectionAccess } from "@/lib/auth/principal";

import { createEditorialListAction } from "../actions";

export const metadata: Metadata = { title: "Listă editorială nouă" };
export default async function NewEditorialListPage() {
  await requireSectionAccess("lists");
  const books = await getSeoHubBookOptions();
  return <><AdminPageHeader eyebrow="Liste editoriale" title="Selecție nouă" description="Indexarea rămâne blocată până când pagina trece toate criteriile editoriale." /><EditorialListForm action={createEditorialListAction} books={books} /></>;
}
