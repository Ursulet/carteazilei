import type { Metadata } from "next";

import { CommercialPartnerForm } from "@/components/admin/commercial-partner-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getCommercialPartnerFormOptions } from "@/db/queries/admin-commercial";
import { requireSectionAccess } from "@/lib/auth/principal";

import { createCommercialPartnerAction } from "../actions";

export const metadata: Metadata = { title: "Partener comercial nou" };

export default async function NewCommercialPartnerPage() {
  await requireSectionAccess("retailers");
  const options = await getCommercialPartnerFormOptions();
  return (
    <>
      <AdminPageHeader
        eyebrow="Monetizare transparentă"
        title="Partener comercial nou"
        description="Adaugă datele de bază; ofertele exacte se leagă ulterior de fiecare carte."
      />
      <CommercialPartnerForm action={createCommercialPartnerAction} options={options} />
    </>
  );
}
