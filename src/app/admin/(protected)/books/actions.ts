"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { parseBookFormData } from "@/domain/editorial/book-input";
import { deleteBook, saveBook } from "@/domain/editorial/book-service";
import { requireMutationAccess } from "@/lib/auth/principal";

export async function createBookAction(_state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("books");
  let id: string;
  try {
    id = await saveBook(parseBookFormData(formData), principal.id);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin/books");
  redirect(`/admin/books/${id}`);
}

export async function updateBookAction(bookId: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requireMutationAccess("books");
  try {
    await saveBook(parseBookFormData(formData), principal.id, bookId);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin/books");
  revalidatePath(`/admin/books/${bookId}`);
  revalidatePath(`/admin/preview/book/${bookId}`);
  redirect(`/admin/books/${bookId}`);
}

export async function deleteBookAction(bookId: string) {
  const principal = await requireMutationAccess("books");
  await deleteBook(bookId, principal.id);
  revalidatePath("/admin/books");
  redirect("/admin/books");
}
