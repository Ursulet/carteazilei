import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CommercialPartnerForm } from "@/components/admin/commercial-partner-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import {
  getAdminCommercialPartner,
  getCommercialPartnerFormOptions,
} from "@/db/queries/admin-commercial";
import { requireSectionAccess } from "@/lib/auth/principal";

import { updateCommercialPartnerAction } from "../actions";

export const metadata: Metadata = { title: "Editează partenerul" };

export default async function EditCommercialPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSectionAccess("retailers");
  const { id } = await params;
  const [partner, options] = await Promise.all([
    getAdminCommercialPartner(id),
    getCommercialPartnerFormOptions(),
  ]);
  if (!partner) notFound();
  return (
    <>
      <AdminPageHeader
        eyebrow="Monetizare transparentă"
        title={partner.name}
        description="Modificările afectează prezentarea ofertelor, niciodată selecția editorială."
      />
      <CommercialPartnerForm
        action={updateCommercialPartnerAction.bind(null, id)}
        editing
        options={options}
        values={partner}
      />
    </>
  );
}
