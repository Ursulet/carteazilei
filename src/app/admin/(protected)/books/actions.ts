"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { parseBookFormData } from "@/domain/editorial/book-input";
import { assignBookCover, bulkAddBookGenre, bulkUpdateBookStatus, deleteBook, saveBook } from "@/domain/editorial/book-service";
import { deleteMedia, uploadMedia } from "@/domain/editorial/media-service";
import { withAdminNotice } from "@/lib/admin/notice";
import { requirePermission } from "@/lib/auth/principal";

export async function createBookAction(_state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const principal = await requirePermission("books.create");
  let id: string;
  try {
    const input = parseBookFormData(formData);
    id = await saveBook({ ...input, status: "draft" }, principal.id);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin/books");
  redirect(withAdminNotice(`/admin/books/${id}`, "Cartea a fost creată."));
}

export async function updateBookAction(bookId: string, _state: EditorialActionState, formData: FormData): Promise<EditorialActionState> {
  const input = parseBookFormData(formData);
  const principal = await requirePermission(input.status === "published" ? "books.publish" : "books.update");
  try {
    await saveBook(input, principal.id, bookId);
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath("/admin/books");
  revalidatePath(`/admin/books/${bookId}`);
  revalidatePath(`/admin/preview/book/${bookId}`);
  redirect(withAdminNotice(`/admin/books/${bookId}`, "Cartea a fost salvată."));
}

export async function deleteBookAction(bookId: string) {
  const principal = await requirePermission("books.delete");
  await deleteBook(bookId, principal.id);
  revalidatePath("/admin/books");
  redirect(withAdminNotice("/admin/books", "Cartea a fost arhivată."));
}

export async function bulkUpdateBookStatusAction(formData: FormData) {
  const requestedStatus = formData.get("status");
  if (requestedStatus !== "draft" && requestedStatus !== "published") {
    redirect(withAdminNotice("/admin/books", "Alege statusul pentru actualizarea în masă."));
  }
  const principal = await requirePermission(requestedStatus === "published" ? "books.publish" : "books.update");
  let notice: string;
  try {
    const result = await bulkUpdateBookStatus(
      formData.getAll("bookIds").filter((value): value is string => typeof value === "string"),
      requestedStatus,
      principal.id,
    );
    const actionLabel = requestedStatus === "published" ? "publicate" : "mutate în Draft";
    notice = `${result.changed} cărți ${actionLabel}. ${result.unchanged} erau deja în starea aleasă.${result.rejected ? ` ${result.rejected} nu au trecut checklistul și au rămas nemodificate.` : ""}`;
  } catch (error) {
    notice = error instanceof Error ? error.message : "Actualizarea în masă nu a putut fi finalizată.";
  }
  revalidatePath("/admin/books");
  revalidatePath("/");
  revalidatePath("/carti");
  revalidatePath("/sitemap.xml");
  redirect(withAdminNotice("/admin/books", notice));
}

export async function bulkAddBookGenreAction(formData: FormData) {
  const principal = await requirePermission("books.update");
  let notice: string;
  try {
    const result = await bulkAddBookGenre(
      formData.getAll("bookIds").filter((value): value is string => typeof value === "string"),
      String(formData.get("genreId") ?? ""),
      principal.id,
    );
    notice = `Genul „${result.genreName}” a fost adăugat la ${result.changed} cărți.${result.unchanged ? ` ${result.unchanged} îl aveau deja.` : ""}${result.missing ? ` ${result.missing} înregistrări nu mai existau.` : ""}`;
  } catch (error) {
    notice = error instanceof Error ? error.message : "Genul nu a putut fi adăugat în masă.";
  }
  revalidatePath("/admin/books");
  revalidatePath("/carti");
  revalidatePath("/");
  redirect(withAdminNotice("/admin/books", notice));
}

export async function uploadBookCoverAction(
  bookId: string,
  _state: EditorialActionState,
  formData: FormData,
): Promise<EditorialActionState> {
  const principal = await requirePermission("media.manage");
  let assetId: string | undefined;
  try {
    assetId = await uploadMedia(formData, principal.id);
    await assignBookCover(bookId, assetId, principal.id);
  } catch (error) {
    if (assetId) await deleteMedia(assetId, principal.id).catch((cleanupError) => console.error("Cover cleanup failed", cleanupError));
    return toActionState(error);
  }
  revalidatePath("/admin/media");
  revalidatePath(`/admin/books/${bookId}`);
  revalidatePath(`/admin/preview/book/${bookId}`);
  redirect(withAdminNotice(`/admin/books/${bookId}`, "Coperta a fost încărcată și selectată."));
}
