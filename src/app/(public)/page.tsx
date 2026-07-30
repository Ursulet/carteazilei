import type { Metadata } from "next";
import { ArrowRight, BookHeart, Compass, Search, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { DailyFeatureSection } from "@/components/editorial/daily-feature-section";
import { ButtonLink } from "@/components/ui/button-link";
import { getCurrentPublicDailyFeature } from "@/db/queries/public-daily-features";
import { getPublicHomepageDiscovery } from "@/db/queries/public-home";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPublicMetadata({
  title: "Ce carte merită timpul tău?",
  description: "Recomandări editoriale explicate, Cartea Zilei și o alegere personalizată pentru următoarea ta lectură.",
  canonical: "/",
});

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">{eyebrow}</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{title}</h2>{description ? <p className="mt-5 text-lg leading-8 text-muted">{description}</p> : null}</div>;
}

export default async function HomePage() {
  const [{ date, feature }, discovery] = await Promise.all([
    getCurrentPublicDailyFeature(),
    getPublicHomepageDiscovery(),
  ]);
  if (!feature) console.warn(`[editorial] Nu există o selecție publică și completă pentru ${date} (Europe/Bucharest).`);

  const hasTaxonomyDiscovery = discovery.genres.length > 0 || discovery.audiences.length > 0;
  return (
    <>
      <section className="overflow-hidden py-16 md:py-24 lg:py-28">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Recomandări de carte, nu liste interminabile</p>
            <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold tracking-[-0.03em] text-balance sm:text-6xl lg:text-7xl">Ce carte merită timpul tău?</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl">Spune-ne ce cauți, ce stare ai și ce ți-a plăcut până acum. Cartea Zilei îți recomandă o singură alegere principală și îți explică de ce.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><ButtonLink href="/recomanda-mi">Recomandă-mi o carte<ArrowRight aria-hidden="true" className="ms-2 size-4" /></ButtonLink><ButtonLink href="/cartea-zilei" variant="secondary">Vezi Cartea Zilei</ButtonLink></div>
            <form action="/cauta" method="get" role="search" className="mt-8 max-w-2xl">
              <label htmlFor="home-search" className="text-sm font-bold">Caută o carte, un autor sau o temă</label>
              <div className="mt-2 flex rounded-full border border-border bg-surface p-1.5 shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15"><Search aria-hidden="true" className="ms-3 mt-2.5 size-5 shrink-0 text-muted" /><input id="home-search" name="q" type="search" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" placeholder="Titlu, autor sau temă" /><button type="submit" className="min-h-11 rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover">Caută</button></div>
            </form>
            <p className="mt-5 text-xs font-semibold text-muted">O alegere clară · motive ușor de înțeles · fără liste interminabile</p>
          </div>
          <div className="relative lg:col-span-5" aria-hidden="true">
            <div className="absolute -inset-12 rounded-full bg-accent-soft/70 blur-3xl" />
            <div className="relative mx-auto aspect-[4/5] max-w-sm rounded-[2rem] border border-border bg-surface p-7 shadow-[0_30px_80px_rgba(23,21,18,0.12)] sm:p-9">
              <div className="flex h-full flex-col justify-between rounded-[1.35rem] border border-accent/30 bg-paper p-7">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-dark">Cum arată o recomandare bună</p>
                <div className="space-y-5 font-display text-3xl leading-tight"><p>O alegere.</p><p>Motive clare.</p><p>O limită spusă sincer.</p></div>
                <div><div className="h-px bg-border" /><p className="mt-5 text-sm leading-6 text-muted">Potrivirea contează mai mult decât popularitatea.</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DailyFeatureSection feature={feature} date={date} />

      <section className="py-16 md:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-border bg-surface p-7 shadow-sm sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:p-14">
            <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Recomandare personalizată</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Nu știi ce să citești?</h2><p className="mt-5 text-lg leading-8 text-muted">Spune-ne ce îți place și ce ai vrea să eviți. Îți propunem o carte și îți explicăm alegerea.</p></div>
            <ButtonLink href="/recomanda-mi" className="mt-8 shrink-0 lg:mt-0">Găsește-mi cartea<ArrowRight aria-hidden="true" className="ms-2 size-4" /></ButtonLink>
          </div>
        </div>
      </section>

      {discovery.moods.length ? <section className="border-y border-border bg-surface py-16 md:py-24 lg:py-28"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><SectionHeading eyebrow="Descoperă după stare" title="Ce ai nevoie de la următoarea carte?" description="Pornește de la efectul pe care îl cauți, nu de la un raft aglomerat." /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{discovery.moods.map((mood) => <Link key={mood.slug} href={`/carti/stare/${mood.slug}`} className="group rounded-2xl border border-border bg-paper p-6 transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"><Sparkles aria-hidden="true" className="size-5 text-accent-dark" /><h3 className="mt-5 font-display text-2xl font-semibold">{mood.name}</h3>{mood.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{mood.description}</p> : null}<span className="mt-5 inline-flex items-center text-sm font-bold text-brand">Vezi selecția<ArrowRight aria-hidden="true" className="ms-2 size-4 transition-transform group-hover:translate-x-0.5" /></span></Link>)}</div></div></section> : null}

      {hasTaxonomyDiscovery ? <section className="py-16 md:py-24 lg:py-28"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><SectionHeading eyebrow="Colecții" title="Explorează după ce cauți" description="Alege un gen sau pornește de la persoana pentru care cauți cartea." /><div className="mt-10 grid gap-8 lg:grid-cols-2">{discovery.genres.length ? <div><h3 className="text-sm font-bold uppercase tracking-wide text-muted">Gen</h3><div className="mt-4 flex flex-wrap gap-3">{discovery.genres.map((genre) => <Link key={genre.slug} href={`/carti/gen/${genre.slug}`} className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-bold transition hover:border-brand hover:bg-accent-soft">{genre.name}</Link>)}</div></div> : null}{discovery.audiences.length ? <div><h3 className="text-sm font-bold uppercase tracking-wide text-muted">Pentru cine</h3><div className="mt-4 flex flex-wrap gap-3">{discovery.audiences.map((audience) => <Link key={audience.slug} href={`/carti/pentru/${audience.slug}`} className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-bold transition hover:border-brand hover:bg-accent-soft">{audience.name}</Link>)}</div></div> : null}</div></div></section> : null}

      {discovery.nextReads.length ? <section className="border-y border-border bg-surface py-16 md:py-24 lg:py-28"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><SectionHeading eyebrow="Continuă lectura" title="Ce să citești după…" description="Dacă ți-a plăcut o carte, găsește următoarea lectură care păstrează tema, ritmul sau atmosfera." /><div className="mt-10 grid gap-4 md:grid-cols-2">{discovery.nextReads.map((item) => <Link key={item.slug} href={`/ce-sa-citesc-dupa/${item.slug}`} className="group rounded-2xl border border-border bg-paper p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-accent-dark">După {item.author}</p><h3 className="mt-3 font-display text-2xl font-semibold">Ce să citești după {item.title}</h3><span className="mt-5 inline-flex items-center text-sm font-bold text-brand">Vezi recomandările<ArrowRight aria-hidden="true" className="ms-2 size-4" /></span></Link>)}</div></div></section> : null}

      {discovery.lists.length ? <section className="py-16 md:py-24 lg:py-28"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><SectionHeading eyebrow="Liste editoriale" title="Selecții cu un criteriu clar" description="Mai puține titluri, fiecare cu un motiv explicit pentru care a intrat în listă." /><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{discovery.lists.map((list) => <Link key={list.slug} href={`/liste/${list.slug}`} className="group rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"><BookHeart aria-hidden="true" className="size-5 text-accent-dark" /><h3 className="mt-5 font-display text-2xl font-semibold">{list.title}</h3>{list.intro ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{list.intro}</p> : null}<span className="mt-5 inline-flex items-center text-sm font-bold text-brand">Deschide lista<ArrowRight aria-hidden="true" className="ms-2 size-4" /></span></Link>)}</div></div></section> : null}

      <section className="border-t border-border bg-paper py-16 md:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><SectionHeading eyebrow="Încredere editorială" title="Cum alegem cărțile" description="O recomandare bună spune și de ce funcționează, și unde s-ar putea să nu fie potrivită." /><div className="mt-10 grid gap-5 md:grid-cols-3">{[{ icon: Compass, title: "Evaluare editorială", text: "Fiecare selecție are un editor, argumente clare și o rezervă sinceră." }, { icon: ShieldCheck, title: "Potrivire, nu popularitate", text: "Ce cauți tu contează mai mult decât topurile sau numărul de titluri." }, { icon: BookHeart, title: "Context înainte de alegere", text: "Îți spunem cui i se potrivește cartea, ce oferă și ce ar putea să nu funcționeze pentru tine." }].map((item) => { const Icon = item.icon; return <article key={item.title} className="rounded-2xl border border-border bg-surface p-6"><Icon aria-hidden="true" className="size-5 text-accent-dark" /><h3 className="mt-5 font-display text-2xl font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-muted">{item.text}</p></article>; })}</div><div className="mt-8"><ButtonLink href="/cum-recomandam" variant="secondary">Vezi cum recomandăm</ButtonLink></div></div>
      </section>
    </>
  );
}
