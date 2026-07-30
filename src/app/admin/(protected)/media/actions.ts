"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { deleteMedia, parseMediaMetadataFormData, updateMediaMetadata, uploadMedia } from "@/domain/editorial/media-service";
import { requireMutationAccess, requirePermission } from "@/lib/auth/principal";

export async function uploadMediaAction(_state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("media");
  try { await uploadMedia(formData, principal.id); } catch (error) { return toActionState(error); }
  revalidatePath("/admin/media");
  redirect("/admin/media");
}
export async function deleteMediaAction(id: string) { const principal = await requireMutationAccess("media"); await deleteMedia(id, principal.id); revalidatePath("/admin/media"); redirect("/admin/media"); }
export async function updateMediaAction(id: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> { const principal = await requirePermission("media.manage"); try { await updateMediaMetadata(id, parseMediaMetadataFormData(formData), principal.id); } catch (error) { return toActionState(error); } revalidatePath("/admin/media"); redirect(`/admin/media/${id}`); }
