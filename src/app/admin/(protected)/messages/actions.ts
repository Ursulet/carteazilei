"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { addContactNote, deleteContactMessage, replyToContactMessage, updateContactMessage } from "@/domain/communication/contact-service";
import { optionalStringValue, stringValue } from "@/domain/editorial/form-data";
import { requirePermission } from "@/lib/auth/principal";
export async function updateMessageAction(id: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> { const principal = await requirePermission("contact_messages.manage"); try { await updateContactMessage(id, { status: stringValue(formData, "status"), assignedTo: optionalStringValue(formData, "assignedTo") }, principal.id); revalidatePath("/admin/messages"); return { status: "idle", message: "Mesajul a fost actualizat." }; } catch (error) { return toActionState(error); } }
export async function addMessageNoteAction(id: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> { const principal = await requirePermission("contact_messages.reply"); try { await addContactNote(id, stringValue(formData, "body"), principal.id); revalidatePath(`/admin/messages/${id}`); return { status: "idle", message: "Nota internă a fost salvată." }; } catch (error) { return toActionState(error); } }
export async function replyMessageAction(id: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> { const principal = await requirePermission("contact_messages.reply"); try { await replyToContactMessage(id, stringValue(formData, "body"), principal.id); revalidatePath(`/admin/messages/${id}`); return { status: "idle", message: "Răspunsul a fost trimis și salvat." }; } catch (error) { return toActionState(error); } }
export async function deleteMessageAction(id: string, _state: EditorialActionState, _formData: FormData): Promise<EditorialActionState> { void _formData; const principal = await requirePermission("contact_messages.delete"); try { await deleteContactMessage(id, principal.id); } catch (error) { return toActionState(error); } revalidatePath("/admin/messages"); redirect("/admin/messages"); }
