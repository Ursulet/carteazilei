import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EditorProfileForm } from "@/components/admin/editor-profile-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getAdminEditorProfile } from "@/domain/editorial/editor-profile-service";
import { requireSectionAccess } from "@/lib/auth/principal";

import { updateEditorProfileAction } from "../actions";

export const metadata: Metadata = { title: "Profil editorial" };

export default async function EditEditorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSectionAccess("editors");
  const { id } = await params;
  const data = await getAdminEditorProfile(id);
  if (!data) notFound();
  return <><AdminPageHeader eyebrow="Echipă" title={data.profile.displayName} description="Controlează profilul public fără a expune identitatea sau rolurile interne." /><EditorProfileForm action={updateEditorProfileAction.bind(null, id)} values={data.profile} media={data.media} /></>;
}
