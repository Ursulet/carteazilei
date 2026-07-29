"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import {
  deleteCommercialPartner,
  parseCommercialPartnerFormData,
  saveCommercialPartner,
} from "@/domain/commercial/commercial-service";
import { requireMutationAccess } from "@/lib/auth/principal";

export async function createCommercialPartnerAction(
  _state: EditorialActionState,
  formData: FormData,
): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("retailers");
  let id: string;
  try {
    id = await saveCommercialPartner(
      parseCommercialPartnerFormData(formData),
      principal.id,
    );
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin/retailers");
  redirect(`/admin/retailers/${id}`);
}

export async function updateCommercialPartnerAction(
  id: string,
  _state: EditorialActionState,
  formData: FormData,
): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("retailers");
  try {
    await saveCommercialPartner(
      parseCommercialPartnerFormData(formData),
      principal.id,
      id,
    );
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin/retailers");
  revalidatePath(`/admin/retailers/${id}`);
  redirect(`/admin/retailers/${id}`);
}

export async function deleteCommercialPartnerAction(id: string) {
  const principal = await requireMutationAccess("retailers");
  await deleteCommercialPartner(id, principal.id);
  revalidatePath("/admin/retailers");
  redirect("/admin/retailers");
}
