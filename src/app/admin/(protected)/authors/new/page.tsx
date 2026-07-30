import type { Metadata } from "next";

import { AuthorForm } from "@/components/admin/author-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getAvailableAuthorPortraits } from "@/domain/editorial/author-service";
import { requireSectionAccess } from "@/lib/auth/principal";

import { createAuthorAction } from "../actions";

export const metadata: Metadata = { title: "Autor nou" };

export default async function NewAuthorPage() {
  await requireSectionAccess("authors");
  const media = await getAvailableAuthorPortraits();
  return (
    <>
      <AdminPageHeader eyebrow="Catalog" title="Autor nou" description="Creează profilul public și adaugă portretul direct din formular." />
      <AuthorForm action={createAuthorAction} media={media} />
    </>
  );
}
