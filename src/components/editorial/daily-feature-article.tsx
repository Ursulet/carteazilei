import { Check, Info } from "lucide-react";
import Link from "next/link";

import { ProductEventTracker } from "@/components/analytics/product-event-tracker";
import type { PublicDailyFeature } from "@/db/queries/public-daily-features";
import { formatEditorialDate } from "@/domain/editorial/bucharest-date";
import { JsonLd } from "@/lib/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo/schema";

import { BookCover } from "./book-cover";
import { Breadcrumbs } from "./breadcrumbs";
import { RetailerOffers } from "./retailer-offers";

export function DailyFeatureArticle({ feature, currentEntry = false }: { feature: PublicDailyFeature; currentEntry?: boolean }) {
  const canonical = `/cartea-zilei/${feature.featureDate}`;
  const structuredBreadcrumbs = breadcrumbJsonLd(currentEntry
    ? [{ name: "Acasă", path: "/" }, { name: "Cartea Zilei", path: canonical }]
    : [{ name: "Acasă", path: "/" }, { name: "Cartea Zilei", path: "/cartea-zilei" }, { name: formatEditorialDate(feature.featureDate), path: canonical }]);
  return (
    <article>
      <JsonLd data={structuredBreadcrumbs} />
      <ProductEventTracker event={{ event: "daily_feature_viewed", dailyFeatureId: feature.id, bookId: feature.book.id, sourcePath: currentEntry ? "/cartea-zilei" : `/cartea-zilei/${feature.featureDate}` }} />
      <section className="py-10 md:py-14">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <Breadcrumbs items={currentEntry
            ? [{ label: "Acasă", href: "/" }, { label: "Cartea Zilei" }]
            : [{ label: "Acasă", href: "/" }, { label: "Cartea Zilei", href: "/cartea-zilei" }, { label: formatEditorialDate(feature.featureDate) }]}
          />
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5"><BookCover cover={feature.cover} title={feature.book.title} priority className="mx-auto max-w-sm" /></div>
            <div className="lg:col-span-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Cartea Zilei · {formatEditorialDate(feature.featureDate)}</p>
              <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">{feature.book.title}</h1>
              <p className="mt-3 text-lg text-muted">de {feature.author.name}</p>
              <p className="mt-7 border-s-4 border-accent ps-5 font-display text-2xl leading-9">{feature.book.verdict}</p>
              <p className="mt-7 text-sm text-muted">Selecție de {feature.editor.publicProfile ? <Link href={`/editor/${feature.editor.slug}`} className="font-bold text-foreground underline decoration-border underline-offset-4">{feature.editor.name}</Link> : <strong className="text-foreground">{feature.editor.name}</strong>}</p>
              <div className="mt-8 flex flex-wrap gap-3"><a href="#analiza" className="inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover">Citește analiza</a><a href="#unde-o-gasesti" className="inline-flex min-h-11 items-center rounded-full border border-border px-6 text-sm font-bold hover:border-brand">Vezi unde o găsești</a></div>
            </div>
          </div>
        </div>
      </section>

      <section id="analiza" className="border-y border-border bg-surface py-16 md:py-24 lg:py-28">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 sm:px-6 md:grid-cols-2 lg:px-8">
          <div className="md:col-span-2"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">De ce am ales-o astăzi</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em]">{feature.headline}</h2><p className="mt-6 max-w-3xl whitespace-pre-line text-lg leading-8 text-muted">{feature.whyToday}</p></div>
          <section className="rounded-2xl border border-border bg-paper p-6"><h2 className="font-display text-2xl font-semibold">O vei aprecia dacă</h2><ul className="mt-5 space-y-4">{feature.fitPoints.map((point) => <li key={point} className="flex gap-3 leading-7"><Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-brand" /><span>{point}</span></li>)}</ul></section>
          <section className="rounded-2xl border border-border bg-paper p-6"><h2 className="flex items-center gap-2 font-display text-2xl font-semibold"><Info aria-hidden="true" className="size-5 text-accent-dark" />De știut înainte</h2><p className="mt-5 leading-7 text-muted">{feature.caveat}</p></section>
          <section className="md:col-span-2"><h2 className="font-display text-3xl font-semibold">Pentru cine este alegerea potrivită</h2><p className="mt-5 max-w-3xl whitespace-pre-line text-lg leading-8 text-muted">{feature.audienceNote}</p></section>
          {feature.book.summary ? <section className="md:col-span-2"><h2 className="font-display text-3xl font-semibold">Despre ce este, fără spoilere</h2><p className="mt-5 max-w-3xl whitespace-pre-line text-lg leading-8 text-muted">{feature.book.summary}</p></section> : null}
        </div>
      </section>

      <section id="unde-o-gasesti" className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-semibold tracking-[-0.03em]">Unde o găsești</h2>
          <RetailerOffers offers={feature.offers} context={{ sourceContext: "daily_feature", sourcePath: currentEntry ? "/cartea-zilei" : `/cartea-zilei/${feature.featureDate}`, dailyFeatureId: feature.id }} />
          <div className="mt-10 border-t border-border pt-6 text-sm text-muted"><Link href="/cartea-zilei/arhiva" className="font-bold text-foreground underline decoration-border underline-offset-4">Vezi toate selecțiile din arhivă</Link><span className="mx-3">·</span><Link href="/cum-recomandam" className="underline underline-offset-4">Cum alegem cărțile</Link></div>
        </div>
      </section>
    </article>
  );
}
