"use server";
import { redirect } from "next/navigation";
import type { EditorialActionState } from "@/domain/editorial/action-state";
import { EditorialServiceError, toActionState } from "@/domain/editorial/action-state";
import { acceptUserInvitation } from "@/domain/auth/internal-user-service";
export async function acceptInvitationAction(token: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> { const password = String(formData.get("password") ?? ""); const confirmation = String(formData.get("confirmation") ?? ""); try { if (password !== confirmation) throw new EditorialServiceError("Parolele nu coincid."); await acceptUserInvitation(token, password); } catch (error) { return toActionState(error); } redirect("/admin/login?invitatie=acceptata"); }
