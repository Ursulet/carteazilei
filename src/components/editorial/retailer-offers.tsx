import { ChevronRight, ExternalLink } from "lucide-react";
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

const homeOfferHeadings: Record<string, string> = {
  publisher: "Cumpără de la editură",
  bookstore: "Cumpără de la librărie",
  marketplace: "Vezi oferta magazinului",
  distributor: "Cumpără de la distribuitor",
};

function homePartnerName(offer: PublicCommercialOffer) {
  if (offer.partnerType !== "publisher" || /^editura\s/i.test(offer.partnerName)) return offer.partnerName;
  return `Editura ${offer.partnerName}`;
}

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
  const params = new URLSearchParams({ context: context.sourceContext, from: context.sourcePath });
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
  variant?: "default" | "dark" | "home";
  hideEmpty?: boolean;
}) {
  if (!offers.length) {
    if (hideEmpty) return null;
    return <div className="mt-8 rounded-2xl border border-border bg-surface p-6"><p className="leading-7 text-muted">Nu avem momentan o ofertă activă pentru această ediție.</p></div>;
  }

  const dark = variant === "dark";
  const home = variant === "home";
  const hasAffiliate = offers.some((offer) => offer.affiliate);
  const hasPaidPlacement = offers.some((offer) => offer.commercialPlacement !== "none");

  return (
    <>
      <CommercialImpressionTracker offerIds={offers.map((offer) => offer.id)} context={context} />
      <div className={home
        ? "mt-4 grid gap-2"
        : `mt-8 grid gap-3 ${offers.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {offers.map((offer, index) => {
          const price = freshPrice(offer);
          const placement = placementLabels[offer.commercialPlacement];
          const logo = offer.logo;
          const primaryHomeOffer = home && index === 0;
          return (
            <Fragment key={offer.id}>
              {!home && index === 1 ? <h3 className={`mt-3 font-display text-2xl font-semibold ${offers.length > 1 ? "sm:col-span-2" : ""}`}>Alte magazine</h3> : null}
              <a
                href={trackingHref(offer.id, context)}
                target="_blank"
                rel={offer.affiliate || placement ? "sponsored nofollow noopener" : "nofollow noopener"}
                className={`flex items-center justify-between gap-3 border transition hover:-translate-y-0.5 hover:shadow-sm ${
                  primaryHomeOffer
                    ? "group min-h-32 rounded-2xl border-rust/60 bg-[linear-gradient(145deg,#173f35_0%,#0d312b_100%)] p-5 text-white shadow-[0_16px_35px_rgba(15,55,47,0.18)] hover:border-rust"
                    : home
                      ? "rounded-xl border-border bg-white/70 p-3 hover:border-rust/50"
                    : dark
                      ? "rounded-2xl border-white/25 bg-white/10 p-5 text-white hover:border-white/60"
                      : offer.isPrimary && index === 0
                        ? "rounded-2xl border-accent bg-accent-soft/40 p-5 hover:border-brand"
                        : "rounded-2xl border-border bg-surface p-5 hover:border-accent"
                }`}
              >
                <span className={`flex min-w-0 items-center ${primaryHomeOffer ? "flex-1 gap-4" : home ? "gap-3" : "gap-4"}`}>
                  {logo?.id && !primaryHomeOffer ? (
                    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg p-1 ${home ? "h-9 w-12 bg-white" : `h-11 w-16 ${dark ? "bg-white" : "bg-paper"}`}`}>
                      <Image src={`/media/${logo.id}`} alt={logo.altText || `Logo ${offer.partnerName}`} width={64} height={40} className="max-h-8 w-auto object-contain" />
                    </span>
                  ) : null}
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className={primaryHomeOffer ? "font-display text-xl font-semibold leading-tight" : home ? "truncate text-sm" : "block"}>
                        {primaryHomeOffer ? offer.ctaLabel ? offer.cta : homeOfferHeadings[offer.partnerType] ?? "Vezi oferta" : offer.partnerName}
                      </strong>
                      {placement ? <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${primaryHomeOffer || dark ? "bg-white/15 text-white" : "bg-paper text-accent-dark"}`}>{placement}</span> : null}
                    </span>
                    {primaryHomeOffer ? <span className="mt-2 block text-sm font-medium text-white/75">{homePartnerName(offer)}</span> : null}
                    <span className={`block ${primaryHomeOffer ? "mt-2 text-xl font-extrabold tracking-[-0.02em] text-white" : home ? "mt-1 text-xs font-semibold text-foreground" : `mt-1 text-xs ${dark ? "text-white/70" : "text-muted"}`}`}>
                      {price ? price : offer.availability ? availabilityLabels[offer.availability] ?? offer.availability : primaryHomeOffer ? offer.cta : "Vezi oferta"}
                    </span>
                    {!home ? <span className={`mt-2 block text-sm font-bold ${dark ? "text-white" : "text-brand"}`}>{offer.cta}</span> : null}
                    {!home && offer.affiliateDisclosure ? <span className={`mt-1 block text-[0.68rem] ${dark ? "text-white/55" : "text-muted"}`}>{offer.affiliateDisclosure}</span> : null}
                  </span>
                </span>
                {primaryHomeOffer ? (
                  <span className="flex shrink-0 flex-col items-end justify-between self-stretch gap-3">
                    {logo?.id ? <span className="flex h-12 w-20 items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-sm"><Image src={`/media/${logo.id}`} alt={logo.altText || `Logo ${offer.partnerName}`} width={80} height={48} className="max-h-9 w-auto object-contain" /></span> : null}
                    <ChevronRight aria-hidden="true" className="size-6 text-white transition-transform group-hover:translate-x-1" />
                  </span>
                ) : home ? <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted" /> : <ExternalLink aria-hidden="true" className={`size-5 shrink-0 ${dark ? "text-white/70" : "text-muted"}`} />}
              </a>
            </Fragment>
          );
        })}
      </div>
      {hasAffiliate ? <p className={`mt-4 max-w-3xl text-[0.7rem] leading-5 ${dark ? "text-white/65" : "text-muted"}`}>Unele linkuri sunt de afiliere. Putem primi un comision, fără cost suplimentar pentru tine.</p> : null}
      {hasPaidPlacement ? <p className={`mt-2 max-w-3xl text-xs leading-5 ${dark ? "text-white/65" : "text-muted"}`}>Conținutul plătit este marcat „Promovat” sau „Parteneriat comercial”.</p> : null}
      {!home ? <p className={`mt-2 max-w-3xl text-xs leading-5 ${dark ? "text-white/55" : "text-muted"}`}>Prețul și disponibilitatea finală sunt cele afișate de partener.</p> : null}
    </>
  );
}
