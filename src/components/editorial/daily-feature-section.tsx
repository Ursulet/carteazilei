import { ArrowRight, Check, Info } from "lucide-react";
import Link from "next/link";

import type { PublicDailyFeature } from "@/db/queries/public-daily-features";
import { formatEditorialDate } from "@/domain/editorial/bucharest-date";

import { BookCover } from "./book-cover";
import { RetailerOffers } from "./retailer-offers";

export function DailyFeatureSection({ feature }: { feature: PublicDailyFeature | null; date: string }) {
  if (!feature) {
    return (
      <section id="cartea-zilei" className="border-y border-border bg-brand py-16 text-white md:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Descoperă o carte</p>
          <div className="mt-5 max-w-3xl">
            <h2 className="font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Găsește o recomandare care ți se potrivește.</h2>
            <p className="mt-5 text-base leading-7 text-white/70 sm:text-lg">Răsfoiește alegerile anterioare sau răspunde la câteva întrebări pentru o recomandare personalizată.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/cartea-zilei/arhiva" className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-brand transition hover:bg-paper">Vezi recomandările</Link><Link href="/recomanda-mi" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-bold text-white transition hover:bg-white hover:text-brand">Recomandă-mi o carte</Link></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="cartea-zilei" className="border-y border-border bg-brand py-16 text-white md:py-24 lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="lg:col-span-4">
          <BookCover cover={feature.cover} title={feature.book.title} className="mx-auto max-w-xs" />
        </div>
        <div className="lg:col-span-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Alegerea editorială de astăzi · {formatEditorialDate(feature.featureDate)}</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{feature.book.title}</h2>
          <p className="mt-2 text-base text-white/65">de {feature.author.name}</p>
          <p className="mt-7 max-w-3xl font-display text-2xl leading-9 text-white/95">{feature.book.verdict}</p>
          <div className="mt-8 grid gap-6 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-white/75">O vei aprecia dacă</h3>
              <ul className="mt-4 space-y-3">{feature.fitPoints.map((point) => <li key={point} className="flex gap-3 text-sm leading-6 text-white/80"><Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-accent" /><span>{point}</span></li>)}</ul>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold"><Info aria-hidden="true" className="size-4 text-accent" />De știut înainte</h3>
              <p className="mt-3 text-sm leading-6 text-white/70">{feature.caveat}</p>
            </div>
          </div>
          <p className="mt-7 text-sm text-white/60">Selecție de {feature.editor.name} · <Link href="/cum-recomandam" className="underline underline-offset-4 hover:text-white">cum recomandăm</Link></p>
          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Unde o găsești</p>
            <RetailerOffers offers={feature.offers.slice(0, 1)} context={{ sourceContext: "daily_feature", sourcePath: "/", dailyFeatureId: feature.id }} variant="dark" hideEmpty />
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={`/cartea-zilei/${feature.featureDate}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-brand transition hover:bg-paper">Vezi analiza<ArrowRight aria-hidden="true" className="ms-2 size-4" /></Link>
            <Link href={`/cartea-zilei/${feature.featureDate}#unde-o-gasesti`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-bold text-white transition hover:bg-white hover:text-brand">Vezi unde o găsești</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
