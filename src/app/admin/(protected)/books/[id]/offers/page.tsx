import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookOfferForm } from "@/components/admin/book-offer-form";
import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import { getAdminBookCommercial } from "@/db/queries/admin-commercial";
import { requireSectionAccess } from "@/lib/auth/principal";

import { createBookOfferAction, deleteBookOfferAction } from "./actions";

export const metadata: Metadata = { title: "Oferte și afiliere" };

const availabilityLabels: Record<string, string> = {
  in_stock: "În stoc",
  out_of_stock: "Stoc epuizat",
  preorder: "Precomandă",
  unknown: "Necunoscută",
};

const placementLabels: Record<string, string> = {
  none: "Editorial-neutră",
  promoted: "Promovat",
  commercial_partnership: "Parteneriat comercial",
};

export default async function BookOffersPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSectionAccess("retailers");
  const { id } = await params;
  const record = await getAdminBookCommercial(id);
  if (!record) notFound();

  return (
    <>
      <AdminPageHeader
        eyebrow="Unde se găsește"
        title={record.book.title}
        description="Ofertele apar după conținutul editorial și nu sunt citite de motorul de recomandare."
      />

      <div className="mb-6">
        <Link href={`/admin/books/${id}`} className="text-sm font-bold text-brand hover:underline">
          ← Înapoi la fișa cărții
        </Link>
      </div>

      {!record.edition ? (
        <EmptyState>Cartea are nevoie de o ediție activă înainte de a putea primi oferte.</EmptyState>
      ) : record.partners.length === 0 ? (
        <EmptyState>
          Adaugă mai întâi un <Link href="/admin/retailers/new" className="font-bold text-brand underline">partener comercial activ</Link>.
        </EmptyState>
      ) : (
        <BookOfferForm
          action={createBookOfferAction.bind(null, id)}
          bookId={id}
          partners={record.partners}
        />
      )}

      <section className="mt-8" aria-labelledby="offers-list-title">
        <h2 id="offers-list-title" className="mb-4 font-display text-2xl font-semibold">Oferte existente</h2>
        {record.offers.length === 0 ? (
          <EmptyState>Nu există încă oferte pentru ediția activă.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-4">Partener</th>
                  <th className="px-5 py-4">Preț</th>
                  <th className="px-5 py-4">Disponibilitate</th>
                  <th className="px-5 py-4">Tip link</th>
                  <th className="px-5 py-4">Plasare</th>
                  <th className="px-5 py-4">Ordine</th>
                  <th className="px-5 py-4"><span className="sr-only">Acțiuni</span></th>
                </tr>
              </thead>
              <tbody>
                {record.offers.map((offer) => (
                  <tr key={offer.id} className="border-b border-border/70 align-top last:border-0">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/books/${id}/offers/${offer.id}`}
                        className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand"
                      >
                        {offer.partnerName}
                      </Link>
                      <span className="mt-1 block max-w-xs truncate text-xs text-muted">{offer.purchaseUrl}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {offer.price && offer.currency ? `${offer.price} ${offer.currency}` : "—"}
                    </td>
                    <td className="px-5 py-4">{availabilityLabels[offer.availability ?? "unknown"]}</td>
                    <td className="px-5 py-4 text-xs">
                      {offer.affiliate ? "Afiliat" : "Neafiliat"}
                      {offer.isPrimary ? <span className="mt-1 block font-bold text-brand">Principală</span> : null}
                      {!offer.active ? <span className="mt-1 block font-bold text-danger">Inactivă</span> : null}
                    </td>
                    <td className="px-5 py-4 text-xs">{placementLabels[offer.commercialPlacement]}</td>
                    <td className="px-5 py-4 font-semibold">{offer.displayOrder}</td>
                    <td className="px-5 py-4">
                      <ConfirmDeleteForm
                        action={deleteBookOfferAction.bind(null, id, offer.id)}
                        message="Confirmi eliminarea acestei oferte? Evenimentele istorice de tracking se păstrează."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
