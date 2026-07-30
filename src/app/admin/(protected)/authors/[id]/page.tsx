import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AuthorForm } from "@/components/admin/author-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getAdminAuthor, getAvailableAuthorPortraits } from "@/domain/editorial/author-service";
import { requireSectionAccess } from "@/lib/auth/principal";

import { updateAuthorAction } from "../actions";

export const metadata: Metadata = { title: "Editează autorul" };

export default async function EditAuthorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSectionAccess("authors");
  const { id } = await params;
  const [author, media] = await Promise.all([getAdminAuthor(id), getAvailableAuthorPortraits()]);
  if (!author) notFound();
  return (
    <>
      <AdminPageHeader eyebrow="Catalog" title={author.name} description="Actualizează portretul, profilul public și trasabilitatea surselor." />
      <AuthorForm
        action={updateAuthorAction.bind(null, id)}
        editing
        media={media}
        values={{
          name: author.name,
          slug: author.slug,
          bio: author.bio,
          portraitAssetId: author.portraitAssetId,
          verifiedFacts: author.verifiedFacts,
          sourceNotes: author.sourceNotes,
          status: author.status,
        }}
      />
    </>
  );
}
