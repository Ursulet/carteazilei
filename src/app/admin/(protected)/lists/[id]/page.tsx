import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EditorialListForm } from "@/components/admin/editorial-list-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getAdminEditorialList, getSeoHubBookOptions } from "@/db/queries/admin-seo-hubs";
import { requireSectionAccess } from "@/lib/auth/principal";

import { updateEditorialListAction } from "../actions";

export const metadata: Metadata = { title: "Editează lista editorială" };
export default async function EditEditorialListPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSectionAccess("lists");
  const { id } = await params;
  const [record, books] = await Promise.all([getAdminEditorialList(id), getSeoHubBookOptions()]);
  if (!record) notFound();
  return <><AdminPageHeader eyebrow="Liste editoriale" title={record.title} description="Actualizează selecția, motivele și condițiile de indexare." /><EditorialListForm action={updateEditorialListAction.bind(null, id)} values={record} books={books} /></>;
}
