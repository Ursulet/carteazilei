import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookRelationshipForm } from "@/components/admin/book-relationship-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getAdminRelationship, getSeoHubBookOptions } from "@/db/queries/admin-seo-hubs";
import { requireSectionAccess } from "@/lib/auth/principal";

import { updateRelationshipAction } from "../actions";

export const metadata: Metadata = { title: "Editează relația editorială" };
export default async function EditRelationshipPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSectionAccess("relationships");
  const { id } = await params;
  const [record, books] = await Promise.all([getAdminRelationship(id), getSeoHubBookOptions()]);
  if (!record) notFound();
  return <><AdminPageHeader eyebrow="Book intelligence" title="Editează relația" description="Activarea reînregistrează aprobarea editorului curent și momentul reviziei." /><BookRelationshipForm action={updateRelationshipAction.bind(null, id)} books={books} values={record} /></>;
}
