"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { parseEditorialListFormData } from "@/domain/editorial/seo-hub-input";
import { deleteEditorialList, saveEditorialList } from "@/domain/editorial/seo-hub-service";
import { requireMutationAccess } from "@/lib/auth/principal";

export async function createEditorialListAction(_state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("lists");
  let id: string;
  try { id = await saveEditorialList(parseEditorialListFormData(formData), principal.id); } catch (error) { return toActionState(error); }
  revalidatePath("/admin/lists");
  redirect(`/admin/lists/${id}`);
}

export async function updateEditorialListAction(id: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("lists");
  try { await saveEditorialList(parseEditorialListFormData(formData), principal.id, id); } catch (error) { return toActionState(error); }
  revalidatePath("/admin/lists"); revalidatePath(`/admin/lists/${id}`); revalidatePath("/liste");
  redirect(`/admin/lists/${id}`);
}

export async function deleteEditorialListAction(id: string) {
  const principal = await requireMutationAccess("lists");
  await deleteEditorialList(id, principal.id);
  revalidatePath("/admin/lists"); revalidatePath("/liste");
  redirect("/admin/lists");
}
