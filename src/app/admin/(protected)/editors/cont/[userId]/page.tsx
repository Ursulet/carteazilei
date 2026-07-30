import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { InternalUserForm } from "@/components/admin/internal-user-form";
import { DeleteInternalUserForm } from "@/components/admin/delete-internal-user-form";
import { UserSecurityActions } from "@/components/admin/user-security-actions";
import { getAdminInternalUser, getAssignableRoles } from "@/domain/auth/internal-user-service";
import { getAdminMedia } from "@/db/queries/admin-media";
import { requireSectionAccess } from "@/lib/auth/principal";

import { deleteInternalUserAction, forcePasswordResetAction, resendInvitationAction, revokeUserSessionsAction, updateInternalUserAction } from "../../actions";

export const metadata: Metadata = { title: "Editează utilizatorul" };

export default async function EditInternalUserPage({ params, searchParams }: { params: Promise<{ userId: string }>; searchParams: Promise<{ invitation?: string; sessions?: string; reset?: string }> }) {
  const principal = await requireSectionAccess("editors");
  const { userId } = await params;
  const [account, availableRoles, media] = await Promise.all([getAdminInternalUser(userId), getAssignableRoles(), getAdminMedia({ status: "active" })]);
  if (!account) notFound();
  const roles = availableRoles.filter((role) => principal.isSuperAdmin || !role.isSuperAdmin || account.roleIds.includes(role.id));
  const query = await searchParams;
  return <><AdminPageHeader eyebrow="Acces intern" title={account.name} description={`Creat ${new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium" }).format(account.createdAt)} · ultima autentificare ${account.lastLoginAt ? new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" }).format(account.lastLoginAt) : "niciodată"}.`} />{query.invitation ? <div className="mb-6 rounded-2xl border border-brand/25 bg-accent-soft p-5"><p className="font-semibold">Linkul de invitație este valabil 72 de ore:</p><code className="mt-2 block break-all text-sm">/admin/invitatie/{query.invitation}</code><p className="mt-2 text-xs text-muted">Trimite acest link numai persoanei invitate. Dacă este generat alt link, acesta devine invalid.</p></div> : null}{query.sessions ? <p className="mb-6 rounded-xl bg-accent-soft p-4 text-sm font-semibold text-brand">Sesiunile au fost revocate.</p> : null}{query.reset ? <p className="mb-6 rounded-xl bg-accent-soft p-4 text-sm font-semibold text-brand">Resetarea parolei este obligatorie la următorul acces.</p> : null}<InternalUserForm action={updateInternalUserAction.bind(null, userId)} editing roles={roles} media={media} values={account} /><UserSecurityActions userId={userId} status={account.status} revokeAction={revokeUserSessionsAction} resetAction={forcePasswordResetAction} inviteAction={resendInvitationAction} /><DeleteInternalUserForm action={deleteInternalUserAction.bind(null, userId)} /></>;
}
