"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { deleteAuthor, parseAuthorFormData, saveAuthor } from "@/domain/editorial/author-service";
import { requireMutationAccess } from "@/lib/auth/principal";

export async function createAuthorAction(_state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("authors");
  let id: string;
  try { id = await saveAuthor(parseAuthorFormData(formData), principal.id); } catch (error) { return toActionState(error); }
  revalidatePath("/admin/authors");
  redirect(`/admin/authors/${id}`);
}

export async function updateAuthorAction(id: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("authors");
  try { await saveAuthor(parseAuthorFormData(formData), principal.id, id); } catch (error) { return toActionState(error); }
  revalidatePath("/admin/authors");
  revalidatePath(`/admin/authors/${id}`);
  redirect(`/admin/authors/${id}`);
}

export async function deleteAuthorAction(id: string) {
  const principal = await requireMutationAccess("authors");
  await deleteAuthor(id, principal.id);
  revalidatePath("/admin/authors");
  redirect("/admin/authors");
}
