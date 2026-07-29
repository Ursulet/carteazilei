"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { parseEditorProfileFormData, saveEditorProfile } from "@/domain/editorial/editor-profile-service";
import { requireMutationAccess } from "@/lib/auth/principal";

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
