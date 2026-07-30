"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { deleteInternalUser, getAdminInternalUser, parseInternalUserFormData, resendUserInvitation, revokeUserSessions, saveInternalUser } from "@/domain/auth/internal-user-service";
import { sendBrandedEmail } from "@/domain/communication/mail-service";
import { createEditorProfileForUser, parseEditorProfileFormData, saveEditorProfile } from "@/domain/editorial/editor-profile-service";
import { getPublicSiteSettings } from "@/domain/settings/public-settings-service";
import { requireMutationAccess, requirePermission } from "@/lib/auth/principal";

async function sendInvitationEmail(email: string, name: string, token: string) {
  try {
    const settings = await getPublicSiteSettings();
    const invitationUrl = new URL(`/admin/invitatie/${encodeURIComponent(token)}`, settings.primaryUrl).toString();
    await sendBrandedEmail({
      to: email,
      subject: `Invitație în administrarea ${settings.siteName}`,
      siteName: settings.siteName,
      logoUrl: settings.logoAssetId ? new URL(`/media/${settings.logoAssetId}`, settings.primaryUrl).toString() : null,
      contactEmail: settings.contactEmail,
      bodyText: `Bună, ${name}!\n\nAi fost invitat(ă) în panoul de administrare ${settings.siteName}. Invitația este valabilă 72 de ore.\n\nActivează contul: ${invitationUrl}`,
    });
  } catch (error) {
    console.error("Invitation email could not be sent; the manual invitation link remains available.", error);
  }
}

export async function updateEditorProfileAction(
  id: string,
  _state: EditorialActionState,
  formData: FormData,
): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("editors");
  let slugs: { previousSlug: string; slug: string };
  try {
    slugs = await saveEditorProfile(id, parseEditorProfileFormData(formData), principal.id);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin/editors");
  revalidatePath("/echipa");
  revalidatePath(`/editor/${slugs.previousSlug}`);
  revalidatePath(`/editor/${slugs.slug}`);
  redirect(`/admin/editors/${id}`);
}

export async function createEditorProfileAction(userId: string) {
  const principal = await requireMutationAccess("editors");
  const editorId = await createEditorProfileForUser(userId, principal.id);
  revalidatePath("/admin/editors");
  redirect(`/admin/editors/${editorId}`);
}

export async function createInternalUserAction(
  _state: EditorialActionState,
  formData: FormData,
): Promise<EditorialActionState> {
  const principal = await requirePermission("users.create");
  let result: { id: string; invitationToken: string | null };
  try {
    const input = parseInternalUserFormData(formData, true);
    result = await saveInternalUser(input, principal.id);
    if (result.invitationToken) await sendInvitationEmail(input.email, input.name, result.invitationToken);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin/editors");
  redirect(`/admin/editors/cont/${result.id}${result.invitationToken ? `?invitation=${encodeURIComponent(result.invitationToken)}` : ""}`);
}

export async function updateInternalUserAction(
  id: string,
  _state: EditorialActionState,
  formData: FormData,
): Promise<EditorialActionState> {
  const principal = await requirePermission("users.update");
  try {
    await saveInternalUser(parseInternalUserFormData(formData, false), principal.id, id);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin/editors");
  redirect(`/admin/editors/cont/${id}`);
}

export async function deleteInternalUserAction(
  id: string,
  _state: EditorialActionState,
  _formData: FormData,
): Promise<EditorialActionState> {
  void _state;
  void _formData;
  const principal = await requirePermission("users.delete");
  try {
    await deleteInternalUser(id, principal.id);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin/editors");
  redirect("/admin/editors");
}

export async function revokeUserSessionsAction(id: string, _formData: FormData) { void _formData; const principal = await requirePermission("users.suspend"); await revokeUserSessions(id, principal.id); revalidatePath(`/admin/editors/cont/${id}`); redirect(`/admin/editors/cont/${id}?sessions=revoked`); }
export async function forcePasswordResetAction(id: string, _formData: FormData) { void _formData; const principal = await requirePermission("users.suspend"); await revokeUserSessions(id, principal.id, true); revalidatePath(`/admin/editors/cont/${id}`); redirect(`/admin/editors/cont/${id}?reset=required`); }
export async function resendInvitationAction(id: string, _formData: FormData) { void _formData; const principal = await requirePermission("users.create"); const user = await getAdminInternalUser(id); const token = await resendUserInvitation(id, principal.id); if (user) await sendInvitationEmail(user.email, user.name, token); revalidatePath(`/admin/editors/cont/${id}`); redirect(`/admin/editors/cont/${id}?invitation=${encodeURIComponent(token)}`); }
