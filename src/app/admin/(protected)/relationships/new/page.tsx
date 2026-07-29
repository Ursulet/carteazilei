import type { Metadata } from "next";

import { BookRelationshipForm } from "@/components/admin/book-relationship-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getSeoHubBookOptions } from "@/db/queries/admin-seo-hubs";
import { requireSectionAccess } from "@/lib/auth/principal";

import { createRelationshipAction } from "../actions";

export const metadata: Metadata = { title: "Relație editorială nouă" };
export default async function NewRelationshipPage() {
  await requireSectionAccess("relationships");
  const books = await getSeoHubBookOptions();
  return <><AdminPageHeader eyebrow="Book intelligence" title="Relație nouă" description="Pentru next read alege explicit ce element al lecturii este continuat." /><BookRelationshipForm action={createRelationshipAction} books={books} /></>;
}
