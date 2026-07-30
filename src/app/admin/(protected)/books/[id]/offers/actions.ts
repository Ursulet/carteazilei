"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  deleteBookOffer,
  parseBookOfferFormData,
  saveBookOffer,
} from "@/domain/commercial/commercial-service";
import type { EditorialActionState } from "@/domain/editorial/action-state";
import { toActionState } from "@/domain/editorial/action-state";
import { withAdminNotice } from "@/lib/admin/notice";
import { requirePermission } from "@/lib/auth/principal";

function revalidateCommercialBookPaths(bookId: string) {
  revalidatePath(`/admin/books/${bookId}/offers`);
  revalidatePath(`/admin/books/${bookId}`);
  revalidatePath("/admin/daily-features");
  revalidatePath("/carte", "layout");
  revalidatePath("/cartea-zilei", "layout");
}

export async function createBookOfferAction(
  bookId: string,
  _state: EditorialActionState,
  formData: FormData,
): Promise<EditorialActionState> {
  const principal = await requirePermission("offers.manage");
  try {
    await saveBookOffer(bookId, parseBookOfferFormData(formData), principal.id);
  } catch (error) {
    return toActionState(error);
  }
  revalidateCommercialBookPaths(bookId);
  redirect(withAdminNotice(`/admin/books/${bookId}/offers`, "Oferta a fost creată."));
}

export async function updateBookOfferAction(
  bookId: string,
  offerId: string,
  _state: EditorialActionState,
  formData: FormData,
): Promise<EditorialActionState> {
  const principal = await requirePermission("offers.manage");
  try {
    await saveBookOffer(
      bookId,
      parseBookOfferFormData(formData),
      principal.id,
      offerId,
    );
  } catch (error) {
    return toActionState(error);
  }
  revalidateCommercialBookPaths(bookId);
  redirect(withAdminNotice(`/admin/books/${bookId}/offers`, "Oferta a fost salvată."));
}

export async function deleteBookOfferAction(bookId: string, offerId: string) {
  const principal = await requirePermission("offers.manage");
  await deleteBookOffer(bookId, offerId, principal.id);
  revalidateCommercialBookPaths(bookId);
  redirect(withAdminNotice(`/admin/books/${bookId}/offers`, "Oferta a fost arhivată."));
}
