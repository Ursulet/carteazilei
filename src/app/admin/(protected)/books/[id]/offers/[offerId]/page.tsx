import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookOfferForm } from "@/components/admin/book-offer-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import {
  getAdminBookCommercial,
  getAdminBookOffer,
} from "@/db/queries/admin-commercial";
import { requireSectionAccess } from "@/lib/auth/principal";

import { updateBookOfferAction } from "../actions";

export const metadata: Metadata = { title: "Editează oferta" };

export default async function EditBookOfferPage({
  params,
}: {
  params: Promise<{ id: string; offerId: string }>;
}) {
  await requireSectionAccess("retailers");
  const { id, offerId } = await params;
  const [record, offer] = await Promise.all([
    getAdminBookCommercial(id),
    getAdminBookOffer(id, offerId),
  ]);
  if (!record || !offer) notFound();
  return (
    <>
      <AdminPageHeader
        eyebrow="Oferte și afiliere"
        title={`Editează oferta pentru ${record.book.title}`}
        description="Prețul și disponibilitatea vor fi marcate ca reverificate la salvare."
      />
      <BookOfferForm
        action={updateBookOfferAction.bind(null, id, offerId)}
        bookId={id}
        partners={record.partners}
        editing
        values={offer}
      />
    </>
  );
}
