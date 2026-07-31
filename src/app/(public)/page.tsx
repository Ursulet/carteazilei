import type { Metadata } from "next";
import {
  ArrowRight,
  BookHeart,
  BookOpen,
  Brain,
  Compass,
  Feather,
  LibraryBig,
  Lightbulb,
  Shapes,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DailyFeatureSection, RecentDailyFeaturesSection } from "@/components/editorial/daily-feature-section";
import { PublicBookCard } from "@/components/editorial/public-book-card";
import { ButtonLink } from "@/components/ui/button-link";
import { getCurrentPublicDailyFeature, listRecentPublicDailyFeatures } from "@/db/queries/public-daily-features";
import { getPublicHomepageDiscovery } from "@/db/queries/public-home";
import { listRandomPublicBookCards } from "@/db/queries/public-book-pages";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPublicMetadata({
  title: "Descoperă cartea potrivită",
  description: "Recomandări editoriale explicate, Cartea Zilei și o alegere personalizată pentru următoarea ta lectură.",
  canonical: "/",
});

const categoryIcons = [BookOpen, Lightbulb, Brain, Feather, LibraryBig];

export default async function HomePage() {
  const [{ date, feature }, discovery, recentDailyFeatures] = await Promise.all([
    getCurrentPublicDailyFeature(),
    getPublicHomepageDiscovery(),
    listRecentPublicDailyFeatures(),
  ]);

  const editorialBookIds = [
    ...(feature ? [feature.book.id] : []),
    ...recentDailyFeatures.map((item) => item.book.id),
  ];
  const randomBooksWithoutEditorialSelections = await listRandomPublicBookCards(editorialBookIds);
  const randomBooks = randomBooksWithoutEditorialSelections.length >= 4
    ? randomBooksWithoutEditorialSelections
    : mergeUniqueBooks(
        randomBooksWithoutEditorialSelections,
        await listRandomPublicBookCards(),
      ).slice(0, 4);

  const quickGenres = discovery.genres.slice(0, 4);
  const editorialCards = discovery.lists.slice(0, 4);

  return (
    <>
      <section className="relative isolate min-h-[34rem] overflow-hidden text-white sm:min-h-[36rem] lg:min-h-[31rem]">
        <Image
          src="/images/home-reading-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[61%_center] lg:object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(26,20,15,0.87)_0%,rgba(27,21,16,0.72)_35%,rgba(27,21,16,0.2)_68%,rgba(27,21,16,0.1)_100%)] lg:bg-[linear-gradient(90deg,rgba(26,20,15,0.82)_0%,rgba(27,21,16,0.58)_37%,rgba(27,21,16,0.12)_68%)]" />

        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 pb-24 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_27rem] lg:items-center lg:px-8 lg:pb-28 lg:pt-16">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#f2b483]">Recomandări editoriale, pe înțelesul tău</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-balance sm:text-6xl lg:text-[4.4rem]">
              Cărțile bune încep cu o recomandare bună.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/82 sm:text-lg">
              Descoperă recomandări personalizate, selecții editoriale zilnice și explicații clare pentru fiecare titlu.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/recomanda-mi" className="min-h-12 bg-brand px-7 shadow-lg hover:bg-brand-hover">
                Primește recomandarea ta <Sparkles aria-hidden="true" className="ms-2 size-4" />
              </ButtonLink>
              <ButtonLink href="#cartea-zilei" variant="secondary" className="min-h-12 border-white/70 bg-white/10 px-7 text-white backdrop-blur-sm hover:bg-white hover:text-foreground">
                Vezi Cartea Zilei <ArrowRight aria-hidden="true" className="ms-2 size-4" />
              </ButtonLink>
            </div>
          </div>

          <aside className="hidden rounded-2xl border border-white/55 bg-surface/95 p-7 text-foreground shadow-[0_20px_60px_rgba(31,22,15,0.25)] backdrop-blur lg:block">
            <p className="flex items-center gap-3 font-display text-2xl font-semibold"><span className="inline-flex size-9 items-center justify-center rounded-full bg-rust-soft text-rust"><BookHeart aria-hidden="true" className="size-4" /></span>Găsește următoarea ta carte</p>
            <p className="mt-2 text-sm leading-6 text-muted">Spune-ne ce îți place și îți recomandăm o singură alegere, cu motive clare.</p>
            {quickGenres.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {quickGenres.map((genre) => (
                  <Link key={genre.slug} href={`/carti/gen/${genre.slug}`} className="inline-flex items-center gap-2 rounded-xl border border-border bg-paper px-3 py-2 text-xs font-semibold transition hover:border-rust hover:text-rust-dark">
                    <BookOpen aria-hidden="true" className="size-3.5" />{genre.name}
                  </Link>
                ))}
              </div>
            ) : null}
            <ButtonLink href="/recomanda-mi" className="mt-5 min-h-12 w-full rounded-xl bg-rust hover:bg-rust-dark">
              Începe recomandarea <ArrowRight aria-hidden="true" className="ms-2 size-4" />
            </ButtonLink>
            <p className="mt-3 text-center text-[0.68rem] text-muted">Durează doar câteva minute.</p>
          </aside>
        </div>
      </section>

      <DailyFeatureSection feature={feature} date={date} />

      <div className="pb-16 lg:pb-24">
        {editorialCards.length || discovery.nextReads.length ? (
          <section className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-6 lg:px-8 lg:py-10">
            <SectionHeader
              eyebrow="Selecții editoriale"
              title="Recomandări pentru următoarea lectură"
              href="/liste"
              action="Vezi toate"
              icon={LibraryBig}
            />
            <div className="mt-6 grid grid-flow-col auto-cols-[minmax(16rem,78vw)] gap-4 overflow-x-auto pb-3 sm:auto-cols-[20rem] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible lg:pb-0">
              {editorialCards.length
                ? editorialCards.map((list, index) => (
                    <EditorialCard key={list.slug} href={`/liste/${list.slug}`} title={list.title} description={list.intro} index={index} />
                  ))
                : discovery.nextReads.map((item, index) => (
                    <EditorialCard key={item.slug} href={`/ce-sa-citesc-dupa/${item.slug}`} title={`După „${item.title}”`} description={`Recomandări pornind de la cartea lui ${item.author}.`} index={index} />
                  ))}
            </div>
          </section>
        ) : null}

        {discovery.genres.length ? (
          <section className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-6 lg:px-8 lg:py-10">
            <SectionHeader eyebrow="Explorează" title="Descoperă cărți după gen" href="/carti" action="Toate cărțile" icon={Shapes} />
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {discovery.genres.slice(0, 5).map((genre, index) => {
                const Icon = categoryIcons[index] ?? BookOpen;
                return (
                  <Link key={genre.slug} href={`/carti/gen/${genre.slug}`} className="group flex min-h-32 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-4 text-center transition hover:-translate-y-0.5 hover:border-rust hover:shadow-sm">
                    <span className="inline-flex size-12 items-center justify-center rounded-full bg-rust-soft text-rust-dark transition group-hover:bg-rust group-hover:text-white"><Icon aria-hidden="true" className="size-6 stroke-[1.6]" /></span>
                    <span className="mt-3 text-sm font-semibold">{genre.name}</span>
                  </Link>
                );
              })}
              <Link href="/carti" className="group flex min-h-32 flex-col items-center justify-center rounded-2xl border border-border bg-paper p-4 text-center transition hover:-translate-y-0.5 hover:border-brand hover:shadow-sm">
                <span className="inline-flex size-12 items-center justify-center rounded-full border border-border bg-surface text-brand"><Shapes aria-hidden="true" className="size-6 stroke-[1.6]" /></span>
                <span className="mt-3 text-sm font-semibold">Toate categoriile</span>
              </Link>
            </div>
          </section>
        ) : null}

        {discovery.moods.length || discovery.audiences.length ? (
          <section className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-6 lg:px-8 lg:py-10">
            <div className="grid overflow-hidden rounded-[1.75rem] border border-border bg-brand text-white lg:grid-cols-[0.9fr_1.1fr]">
              <div className="p-7 sm:p-10 lg:p-12">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#efb687]">Pornește de la starea ta</p>
                <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.035em]">Ce ai nevoie de la următoarea carte?</h2>
                <p className="mt-4 max-w-lg text-sm leading-7 text-white/70">Alege atmosfera sau cititorul pentru care cauți. Vei vedea doar selecții editoriale deja publicate.</p>
                <ButtonLink href="/recomanda-mi" className="mt-7 bg-white text-brand hover:bg-paper">Primește o recomandare <Sparkles aria-hidden="true" className="ms-2 size-4" /></ButtonLink>
              </div>
              <div className="grid content-center gap-3 bg-white/5 p-7 sm:grid-cols-2 sm:p-10">
                {discovery.moods.slice(0, 4).map((mood) => (
                  <Link key={mood.slug} href={`/carti/stare/${mood.slug}`} className="flex min-h-16 items-center justify-between rounded-xl border border-white/15 bg-white/8 px-4 text-sm font-semibold transition hover:border-white/45 hover:bg-white/12">
                    <span className="flex items-center gap-3"><Sparkles aria-hidden="true" className="size-4 text-[#efb687]" />{mood.name}</span><ArrowRight aria-hidden="true" className="size-4 text-white/50" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-6 lg:px-8 lg:py-10">
          <div className="rounded-[1.75rem] border border-border bg-surface p-7 sm:p-10">
            <SectionHeader eyebrow="Încredere editorială" title="O recomandare explicată, nu un simplu titlu" href="/cum-recomandam" action="Cum recomandăm" icon={ShieldCheck} />
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <TrustItem icon={Compass} title="Evaluare editorială" text="Fiecare alegere are argumente clare și o limită spusă sincer." />
              <TrustItem icon={ShieldCheck} title="Potrivire, nu popularitate" text="Preferințele cititorului contează mai mult decât un clasament." />
              <TrustItem icon={BookHeart} title="Context înainte de alegere" text="Îți spunem cui i se potrivește cartea și ce experiență oferă." />
            </div>
          </div>
        </section>

        <RecentDailyFeaturesSection features={recentDailyFeatures} />

        {randomBooks.length ? (
          <section className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="catalog-discovery-heading">
            <SectionHeader eyebrow="Din biblioteca noastră" title="Descoperă și alte cărți" href="/carti" action="Vezi toate cărțile" icon={BookOpen} headingId="catalog-discovery-heading" />
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {randomBooks.map((book) => <PublicBookCard key={book.id} book={book} />)}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}

function mergeUniqueBooks<T extends { id: string }>(...groups: T[][]) {
  const unique = new Map<string, T>();
  for (const group of groups) {
    for (const book of group) unique.set(book.id, book);
  }
  return [...unique.values()];
}

function SectionHeader({ eyebrow, title, href, action, icon: Icon, headingId }: { eyebrow: string; title: string; href: string; action: string; icon: LucideIcon; headingId?: string }) {
  return (
    <div className="flex items-end justify-between gap-5">
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-3">
        <span className="mt-0.5 inline-flex size-11 items-center justify-center rounded-full bg-rust-soft text-rust-dark"><Icon aria-hidden="true" className="size-5 stroke-[1.7]" /></span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-rust-dark">{eyebrow}</p>
          <h2 id={headingId} className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{title}</h2>
        </div>
      </div>
      <Link href={href} className="hidden shrink-0 items-center text-sm font-bold text-rust-dark hover:text-rust sm:inline-flex">{action}<ArrowRight aria-hidden="true" className="ms-2 size-4" /></Link>
    </div>
  );
}

function EditorialCard({ href, title, description, index }: { href: string; title: string; description: string | null; index: number }) {
  const palettes = ["from-[#25473e] to-[#739080]", "from-[#8f4b2c] to-[#d59865]", "from-[#394d67] to-[#91a5b9]", "from-[#65513c] to-[#b39b7e]"];
  return (
    <Link href={href} className="group overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-0.5 hover:border-rust hover:shadow-md">
      <div className={`h-24 bg-gradient-to-br ${palettes[index % palettes.length]} p-5 text-white`}><BookOpen aria-hidden="true" className="size-7 stroke-[1.4] opacity-85" /></div>
      <div className="p-5">
        <h3 className="line-clamp-2 font-display text-2xl font-semibold leading-tight">{title}</h3>
        {description ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{description}</p> : null}
        <span className="mt-4 inline-flex items-center text-xs font-bold text-rust-dark">Vezi selecția <ArrowRight aria-hidden="true" className="ms-1 size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  );
}

function TrustItem({ icon: Icon, title, text }: { icon: typeof Compass; title: string; text: string }) {
  return (
    <article className="rounded-2xl bg-paper p-5">
      <Icon aria-hidden="true" className="size-5 text-rust" />
      <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </article>
  );
}
