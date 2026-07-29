import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { Fragment } from "react";

import type { PublicCommercialOffer } from "@/db/queries/public-commercial-offers";
import type { CommercialTrackingContext } from "@/domain/commercial/tracking-service";

import { CommercialImpressionTracker } from "./commercial-impression-tracker";

const PRICE_FRESHNESS_MS = 24 * 60 * 60 * 1_000;
const availabilityLabels: Record<string, string> = {
  in_stock: "În stoc",
  out_of_stock: "Stoc epuizat",
  preorder: "Precomandă",
  unknown: "Disponibilitate neconfirmată",
};
const placementLabels: Record<string, string> = {
  promoted: "Promovat",
  commercial_partnership: "Parteneriat comercial",
};

function freshPrice(offer: PublicCommercialOffer) {
  if (!offer.price || !offer.currency || !offer.checkedAt || offer.availability === "out_of_stock") return null;
  const age = Date.now() - offer.checkedAt.getTime();
  if (age < 0 || age > PRICE_FRESHNESS_MS) return null;
  try {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: offer.currency }).format(Number(offer.price));
  } catch {
    return null;
  }
}

function trackingHref(offerId: string, context: CommercialTrackingContext) {
  const params = new URLSearchParams({
    context: context.sourceContext,
    from: context.sourcePath,
  });
  if (context.dailyFeatureId) params.set("daily", context.dailyFeatureId);
  if (context.recommendationResultId) params.set("recommendation", context.recommendationResultId);
  return `/go/oferta/${offerId}?${params.toString()}`;
}

export function RetailerOffers({
  offers,
  context,
  variant = "default",
  hideEmpty = false,
}: {
  offers: PublicCommercialOffer[];
  context: CommercialTrackingContext;
  variant?: "default" | "dark";
  hideEmpty?: boolean;
}) {
  if (!offers.length) {
    if (hideEmpty) return null;
    return <div className="mt-8 rounded-2xl border border-border bg-surface p-6"><p className="leading-7 text-muted">Nu avem momentan o ofertă activă pentru această ediție.</p></div>;
  }
  const dark = variant === "dark";
  const hasAffiliate = offers.some((offer) => offer.affiliate);
  const hasPaidPlacement = offers.some((offer) => offer.commercialPlacement !== "none");

  return (
    <>
      <CommercialImpressionTracker offerIds={offers.map((offer) => offer.id)} context={context} />
      <div className={`mt-8 grid gap-3 ${offers.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {offers.map((offer, index) => {
          const price = freshPrice(offer);
          const placement = placementLabels[offer.commercialPlacement];
          const logo = offer.logo;
          return (
            <Fragment key={offer.id}>
              {index === 1 ? <h3 className={`mt-3 font-display text-2xl font-semibold ${offers.length > 1 ? "sm:col-span-2" : ""}`}>Alte opțiuni</h3> : null}
            <a
              href={trackingHref(offer.id, context)}
              target="_blank"
              rel={offer.affiliate || placement ? "sponsored nofollow noopener" : "nofollow noopener"}
              className={`flex items-center justify-between gap-4 rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-sm ${dark ? "border-white/25 bg-white/10 text-white hover:border-white/60" : offer.isPrimary && index === 0 ? "border-accent bg-accent-soft/40 hover:border-brand" : "border-border bg-surface hover:border-accent"}`}
            >
              <span className="flex min-w-0 items-center gap-4">
                {logo?.id ? (
                  <span className={`flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg p-1 ${dark ? "bg-white" : "bg-paper"}`}>
                    <Image src={`/media/${logo.id}`} alt={logo.altText || `Logo ${offer.partnerName}`} width={64} height={40} className="max-h-9 w-auto object-contain" />
                  </span>
                ) : null}
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="block">{offer.partnerName}</strong>
                    {placement ? <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${dark ? "bg-white/15 text-white" : "bg-paper text-accent-dark"}`}>{placement}</span> : null}
                    {offer.isPrimary && index === 0 ? <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${dark ? "bg-white text-brand" : "bg-brand text-white"}`}>Opțiunea principală</span> : null}
                  </span>
                  <span className={`mt-1 block text-xs ${dark ? "text-white/70" : "text-muted"}`}>
                    {price ? `${price} · ` : ""}{offer.availability ? availabilityLabels[offer.availability] ?? offer.availability : "Verifică disponibilitatea"}
                  </span>
                  <span className={`mt-2 block text-sm font-bold ${dark ? "text-white" : "text-brand"}`}>{offer.cta}</span>
                  {price ? <span className={`mt-1 block text-[0.68rem] ${dark ? "text-white/55" : "text-muted"}`}>Preț verificat în ultimele 24 de ore</span> : null}
                  {offer.affiliateDisclosure ? <span className={`mt-1 block text-[0.68rem] ${dark ? "text-white/55" : "text-muted"}`}>{offer.affiliateDisclosure}</span> : null}
                </span>
              </span>
              <ExternalLink aria-hidden="true" className={`size-5 shrink-0 ${dark ? "text-white/70" : "text-muted"}`} />
            </a>
            </Fragment>
          );
        })}
      </div>
      {hasAffiliate ? <p className={`mt-5 max-w-3xl text-xs leading-5 ${dark ? "text-white/65" : "text-muted"}`}>Unele linkuri pot fi de afiliere. Dacă cumperi prin ele, Cartea Zilei poate primi un comision, fără cost suplimentar pentru tine. Acest lucru nu influențează recomandarea editorială.</p> : null}
      {hasPaidPlacement ? <p className={`mt-2 max-w-3xl text-xs leading-5 ${dark ? "text-white/65" : "text-muted"}`}>Plasările marcate „Promovat” sau „Parteneriat comercial” sunt colaborări comerciale și sunt distincte de simpla afiliere.</p> : null}
      <p className={`mt-2 max-w-3xl text-xs leading-5 ${dark ? "text-white/55" : "text-muted"}`}>Prețul și disponibilitatea finală sunt cele afișate de partener.</p>
    </>
  );
}
