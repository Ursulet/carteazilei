"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { parseTaxonomyHubFormData } from "@/domain/editorial/seo-hub-input";
import { saveTaxonomyHub } from "@/domain/editorial/seo-hub-service";
import { withAdminNotice } from "@/lib/admin/notice";
import { requireMutationAccess } from "@/lib/auth/principal";

export async function createTaxonomyAction(kind: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("taxonomies");
  let id: string;
  try { id = await saveTaxonomyHub(parseTaxonomyHubFormData(kind, formData), principal.id); } catch (error) { return toActionState(error); }
  revalidatePath("/admin/taxonomies"); revalidatePath("/carti");
  redirect(withAdminNotice(`/admin/taxonomies/${kind}/${id}`, "Elementul de taxonomie a fost creat."));
}

export async function updateTaxonomyAction(kind: string, id: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("taxonomies");
  try { await saveTaxonomyHub(parseTaxonomyHubFormData(kind, formData), principal.id, id); } catch (error) { return toActionState(error); }
  revalidatePath("/admin/taxonomies"); revalidatePath(`/admin/taxonomies/${kind}/${id}`); revalidatePath("/carti");
  redirect(withAdminNotice(`/admin/taxonomies/${kind}/${id}`, "Elementul de taxonomie a fost salvat."));
}
