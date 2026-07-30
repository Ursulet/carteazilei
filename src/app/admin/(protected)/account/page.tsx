import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { OwnAccountForm } from "@/components/admin/own-account-form";
import { requireInternalPrincipal } from "@/lib/auth/principal";

import { updateOwnAccountAction } from "./actions";

export const metadata: Metadata = { title: "Contul meu" };

export default async function OwnAccountPage() {
  const principal = await requireInternalPrincipal();
  return <><AdminPageHeader eyebrow="Securitate" title="Contul meu" description="Schimbă numele, adresa de autentificare sau parola contului curent." /><OwnAccountForm action={updateOwnAccountAction} name={principal.name} email={principal.email} /></>;
}
