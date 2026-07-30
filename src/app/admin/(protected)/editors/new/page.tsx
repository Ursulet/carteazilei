import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { InternalUserForm } from "@/components/admin/internal-user-form";
import { getAssignableRoles } from "@/domain/auth/internal-user-service";
import { getAdminMedia } from "@/db/queries/admin-media";
import { requireSectionAccess } from "@/lib/auth/principal";

import { createInternalUserAction } from "../actions";

export const metadata: Metadata = { title: "Utilizator nou" };

export default async function NewInternalUserPage() {
  const principal = await requireSectionAccess("editors");
  const [availableRoles, media] = await Promise.all([getAssignableRoles(), getAdminMedia({ status: "active" })]);
  const roles = availableRoles.filter((role) => principal.isSuperAdmin || !role.isSuperAdmin);
  return <><AdminPageHeader eyebrow="Acces intern" title="Utilizator nou" description="Creează contul, trimite o invitație și atribuie rolurile care controlează accesul." /><InternalUserForm action={createInternalUserAction} roles={roles} media={media} /></>;
}
