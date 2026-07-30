"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { parseBookRelationshipFormData } from "@/domain/editorial/seo-hub-input";
import { saveBookRelationship } from "@/domain/editorial/seo-hub-service";
import { withAdminNotice } from "@/lib/admin/notice";
import { requireMutationAccess } from "@/lib/auth/principal";

export async function createRelationshipAction(_state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("relationships");
  let id: string;
  try { id = await saveBookRelationship(parseBookRelationshipFormData(formData), principal.id); } catch (error) { return toActionState(error); }
  revalidatePath("/admin/relationships"); revalidatePath("/carte");
  redirect(withAdminNotice(`/admin/relationships/${id}`, "Relația dintre cărți a fost creată."));
}

export async function updateRelationshipAction(id: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("relationships");
  try { await saveBookRelationship(parseBookRelationshipFormData(formData), principal.id, id); } catch (error) { return toActionState(error); }
  revalidatePath("/admin/relationships"); revalidatePath("/carte");
  redirect(withAdminNotice(`/admin/relationships/${id}`, "Relația dintre cărți a fost salvată."));
}
