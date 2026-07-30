"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { parseOwnAccountFormData, updateOwnAccount } from "@/domain/auth/internal-user-service";
import { requireInternalPrincipal } from "@/lib/auth/principal";

export async function updateOwnAccountAction(_state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requireInternalPrincipal();
  let result: { securityChanged: boolean };
  try {
    result = await updateOwnAccount(parseOwnAccountFormData(formData), principal.id);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin", "layout");
  if (result.securityChanged) redirect("/admin/login?cont-actualizat=1");
  return { status: "idle", message: "Datele contului au fost salvate." };
}
