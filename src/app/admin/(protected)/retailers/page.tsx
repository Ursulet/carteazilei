import type { Metadata } from "next";
import Link from "next/link";

import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import {
  getAdminCommercialPartners,
  getCommercialOverview,
} from "@/db/queries/admin-commercial";
import { requireSectionAccess } from "@/lib/auth/principal";

import { deleteCommercialPartnerAction } from "./actions";

export const metadata: Metadata = { title: "Parteneri comerciali" };

const typeLabels: Record<string, string> = {
  publisher: "Editură",
  bookstore: "Librărie",
  marketplace: "Marketplace",
  distributor: "Distribuitor",
};

function ctr(clicks: number, impressions: number) {
  return impressions > 0 ? `${((clicks / impressions) * 100).toFixed(1)}%` : "—";
}

export default async function CommercialPartnersPage() {
  await requireSectionAccess("retailers");
  const [rows, overview] = await Promise.all([
    getAdminCommercialPartners(),
    getCommercialOverview(),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Monetizare transparentă"
        title="Parteneri comerciali"
        description="Administrează edituri, librării, marketplace-uri și distribuitori. Datele comerciale rămân în afara selecției și scorului editorial."
        action={{ href: "/admin/retailers/new", label: "Partener nou" }}
      />

      <section aria-labelledby="commercial-overview" className="mb-8 grid gap-4 lg:grid-cols-3">
        <h2 id="commercial-overview" className="sr-only">Rezumat comercial</h2>
        <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Total</p>
          <p className="mt-2 text-3xl font-bold">{overview.totals.clicks} clickuri</p>
          <p className="mt-1 text-sm text-muted">
            {overview.totals.impressions} afișări · CTR {ctr(overview.totals.clicks, overview.totals.impressions)}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Parteneri cu clickuri</p>
          <ol className="mt-3 space-y-2 text-sm">
            {overview.topPartners.slice(0, 3).map((partner) => (
              <li key={partner.id} className="flex justify-between gap-3">
                <span>{partner.name}</span><strong>{partner.clicks}</strong>
              </li>
            ))}
          </ol>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Cărți cu clickuri</p>
          <ol className="mt-3 space-y-2 text-sm">
            {overview.topBooks.slice(0, 3).map((book) => (
              <li key={book.id} className="flex justify-between gap-3">
                <span>{book.title}</span><strong>{book.clicks}</strong>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_2fr]" aria-labelledby="commercial-performance">
        <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 id="commercial-performance" className="font-display text-2xl font-semibold">CTR după context</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            {overview.contexts.map((context) => {
              const labels: Record<string, string> = {
                book_page: "Pagini de carte",
                daily_feature: "Cartea Zilei",
                recommendation: "Recomandări personalizate",
              };
              return <div key={context.sourceContext} className="flex items-center justify-between gap-4 rounded-xl bg-paper px-4 py-3"><dt>{labels[context.sourceContext] ?? context.sourceContext}</dt><dd className="text-right"><strong>{ctr(context.clicks, context.impressions)}</strong><span className="ms-2 text-xs text-muted">{context.clicks}/{context.impressions}</span></dd></div>;
            })}
          </dl>
        </article>
        <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="p-5"><h2 className="font-display text-2xl font-semibold">Performanță per ofertă</h2><p className="mt-1 text-xs leading-5 text-muted">Clickuri, afișări și rata de accesare pentru fiecare ofertă.</p></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-y border-border bg-paper text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-3">Carte / partener</th><th className="px-5 py-3">Clickuri</th><th className="px-5 py-3">Afișări</th><th className="px-5 py-3">CTR</th></tr></thead>
              <tbody>{overview.topOffers.map((offer) => <tr key={offer.id} className="border-b border-border/70 last:border-0"><td className="px-5 py-3"><strong className="block">{offer.bookTitle}</strong><span className="text-xs text-muted">{offer.partnerName}</span></td><td className="px-5 py-3 font-semibold">{offer.clicks}</td><td className="px-5 py-3">{offer.impressions}</td><td className="px-5 py-3 font-semibold">{ctr(offer.clicks, offer.impressions)}</td></tr>)}</tbody>
            </table>
          </div>
        </article>
      </section>

      {rows.length === 0 ? (
        <EmptyState>Nu există încă parteneri comerciali. Adaugă prima editură sau librărie pentru a putea crea oferte.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-4">Partener</th>
                <th className="px-5 py-4">Tip</th>
                <th className="px-5 py-4">Relație</th>
                <th className="px-5 py-4">Oferte</th>
                <th className="px-5 py-4">Clickuri</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4"><span className="sr-only">Acțiuni</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((partner) => (
                <tr key={partner.id} className="border-b border-border/70 last:border-0">
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/retailers/${partner.id}`}
                      className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand"
                    >
                      {partner.name}
                    </Link>
                    <span className="mt-1 block text-xs text-muted">/{partner.slug}</span>
                  </td>
                  <td className="px-5 py-4">{typeLabels[partner.partnerType] ?? partner.partnerType}</td>
                  <td className="px-5 py-4 text-xs text-muted">
                    {[partner.affiliate ? "Afiliat" : null, partner.commercialPartner ? "Parteneriat" : null]
                      .filter(Boolean)
                      .join(" · ") || "Listare simplă"}
                  </td>
                  <td className="px-5 py-4 font-semibold">{partner.offerCount}</td>
                  <td className="px-5 py-4 font-semibold">{partner.clickCount}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${partner.active ? "bg-accent-soft text-brand" : "bg-paper text-muted"}`}>
                      {partner.active ? "Activ" : "Inactiv"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <ConfirmDeleteForm
                      action={deleteCommercialPartnerAction.bind(null, partner.id)}
                      message="Confirmi eliminarea partenerului? Partenerii cu oferte active nu pot fi șterși."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
