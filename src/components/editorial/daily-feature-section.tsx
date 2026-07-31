import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  History,
  Info,
  ShoppingBag,
  Star,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import type { DailyArchiveItem, PublicDailyFeature } from "@/db/queries/public-daily-features";
import { formatEditorialDate } from "@/domain/editorial/bucharest-date";

import { BookCover } from "./book-cover";
import { RetailerOffers } from "./retailer-offers";

export function DailyFeatureSection({ feature, date }: { feature: PublicDailyFeature | null; date: string }) {
  if (!feature) {
    return (
      <section id="cartea-zilei" className="relative z-10 -mt-10 px-4 pb-12 sm:px-6 lg:-mt-14 lg:px-8">
        <div className="mx-auto max-w-[1440px] rounded-[1.75rem] border border-border bg-surface p-7 shadow-[0_22px_70px_rgba(43,32,22,0.16)] sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rust">Cartea Zilei · {formatEditorialDate(date)}</p>
          <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 className="font-display text-4xl font-semibold tracking-[-0.03em]">Următoarea alegere editorială apare aici.</h2>
              <p className="mt-4 leading-7 text-muted">Până atunci poți descoperi selecțiile publicate sau poți primi o recomandare pornind de la preferințele tale.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/cartea-zilei/arhiva" className="inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover">Vezi selecțiile <ArrowRight aria-hidden="true" className="ms-2 size-4" /></Link>
              <Link href="/recomanda-mi" className="inline-flex min-h-11 items-center rounded-full border border-border px-6 text-sm font-bold hover:border-rust">Primește o recomandare <Star aria-hidden="true" className="ms-2 size-4" /></Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const publication = publicationLabel(feature.edition.publicationDate, feature.edition.publicationYear);
  const hasEditionDetails = Boolean(feature.edition.pageCount || publication || feature.edition.publisher);

  return (
    <section id="cartea-zilei" className="relative z-10 -mt-10 px-4 pb-10 sm:px-6 lg:-mt-14 lg:px-8 lg:pb-12">
      <article className="mx-auto max-w-[1440px] rounded-[1.75rem] border border-white/70 bg-surface/95 p-4 shadow-[0_24px_80px_rgba(43,32,22,0.18)] backdrop-blur sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3 border-b border-border/80 pb-4">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-rust-soft text-rust"><Star aria-hidden="true" className="size-4" /></span>
          <p className="text-sm font-extrabold uppercase tracking-[0.13em] text-rust">Cartea Zilei</p>
          <span className="h-4 w-px bg-border" />
          <p className="text-xs text-muted sm:text-sm">{formatEditorialDate(feature.featureDate)}</p>
        </div>

        <div className={`mt-5 grid gap-7 ${feature.offers.length ? "lg:grid-cols-[13.5rem_minmax(0,1fr)_minmax(17rem,0.72fr)] xl:grid-cols-[15rem_minmax(0,1.15fr)_20rem]" : "lg:grid-cols-[15rem_minmax(0,1fr)]"} xl:gap-9`}>
          <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] items-start gap-5 lg:block">
            <BookCover cover={feature.cover} title={feature.book.title} priority className="w-full lg:mx-auto" />
            <div className="lg:hidden">
              <h2 className="font-display text-3xl font-semibold leading-[1.03] tracking-[-0.03em]">{feature.book.title}</h2>
              <p className="mt-2 text-sm font-semibold text-rust">{feature.author.name}</p>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{feature.book.summary || feature.book.verdict}</p>
            </div>
          </div>

          <div className="min-w-0">
            <div className="hidden lg:block">
              <h2 className="font-display text-4xl font-semibold leading-[1.03] tracking-[-0.035em] xl:text-5xl">{feature.book.title}</h2>
              <p className="mt-2 font-semibold text-rust">de {feature.author.name}</p>
              <p className="mt-5 line-clamp-2 max-w-2xl text-base leading-7 text-muted">{feature.book.summary || feature.book.verdict}</p>
            </div>

            {hasEditionDetails ? (
              <dl className="mt-5 flex flex-wrap gap-x-5 gap-y-3 border-y border-border py-4 text-xs font-medium text-muted">
                {feature.edition.pageCount ? <EditionDetail icon={BookOpen} label={`${feature.edition.pageCount} pagini`} /> : null}
                {publication ? <EditionDetail icon={CalendarDays} label={publication} /> : null}
                {feature.edition.publisher ? <EditionDetail icon={Building2} label={`Editura ${feature.edition.publisher}`} /> : null}
              </dl>
            ) : null}

            <div className={`grid gap-4 pt-5 sm:grid-cols-2 ${hasEditionDetails ? "" : "border-t border-border lg:mt-6"}`}>
              <EditorialPoint icon={Star} title="De ce merită citită" text={feature.whyToday || feature.headline || feature.book.verdict || "O alegere editorială explicată clar."} />
              <EditorialPoint icon={UsersRound} title="Pentru cine este potrivită" text={feature.audienceNote} />
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
              <Link href={`/cartea-zilei/${feature.featureDate}`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-rust px-6 text-sm font-bold text-white transition hover:bg-rust-dark">
                Vezi recomandarea <ArrowRight aria-hidden="true" className="ms-2 size-4" />
              </Link>
              <span className="inline-flex items-start gap-2 text-xs leading-5 text-muted sm:max-w-xs"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span className="line-clamp-2">{feature.caveat}</span></span>
            </div>
          </div>

          {feature.offers.length ? <aside className="min-w-0 rounded-2xl border border-border bg-paper/65 p-4 sm:p-5" aria-labelledby="daily-offers-heading">
            <h3 id="daily-offers-heading" className="flex items-center gap-2 font-display text-2xl font-semibold"><ShoppingBag aria-hidden="true" className="size-5 text-rust" />Unde o poți cumpăra</h3>
            <p className="mt-1 text-xs text-muted">Alege oferta recomandată de noi.</p>
            <RetailerOffers
              offers={feature.offers.slice(0, 4)}
              context={{ sourceContext: "daily_feature", sourcePath: "/", dailyFeatureId: feature.id }}
              variant="home"
              hideEmpty
            />
            {feature.offers.length > 4 ? <Link href={`/cartea-zilei/${feature.featureDate}#unde-o-gasesti`} className="mt-3 inline-flex items-center text-xs font-bold text-brand">Vezi toate opțiunile <ArrowRight aria-hidden="true" className="ms-1 size-3.5" /></Link> : null}
          </aside> : null}
        </div>
      </article>
    </section>
  );
}

export function RecentDailyFeaturesSection({ features }: { features: DailyArchiveItem[] }) {
  if (!features.length) return null;

  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="recent-daily-heading">
      <div className="flex items-end justify-between gap-5">
        <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-3">
          <span className="mt-0.5 inline-flex size-11 items-center justify-center rounded-full bg-rust-soft text-rust-dark"><History aria-hidden="true" className="size-5 stroke-[1.7]" /></span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-rust-dark">Din selecțiile trecute</p>
            <h2 id="recent-daily-heading" className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Selecțiile noastre</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Cărți alese și explicate în zilele anterioare.</p>
          </div>
        </div>
        <Link href="/cartea-zilei/arhiva" className="hidden shrink-0 items-center text-sm font-bold text-rust-dark hover:text-rust sm:inline-flex">Vezi arhiva <ArrowRight aria-hidden="true" className="ms-2 size-4" /></Link>
      </div>

      <div className="mt-6 grid grid-flow-col auto-cols-[minmax(17rem,82vw)] gap-4 overflow-x-auto pb-3 sm:auto-cols-[21rem] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible lg:pb-0">
        {features.map((feature) => (
          <Link key={feature.id} href={`/cartea-zilei/${feature.featureDate}`} className="group grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-2xl border border-border bg-surface p-3 transition hover:-translate-y-0.5 hover:border-rust hover:shadow-md">
            <BookCover cover={feature.cover} title={feature.book.title} className="w-full rounded-lg shadow-md" />
            <div className="min-w-0 py-1">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-rust-dark">{formatEditorialDate(feature.featureDate)}</p>
              <h3 className="mt-2 line-clamp-2 font-display text-xl font-semibold leading-tight">{feature.book.title}</h3>
              <p className="mt-1 truncate text-xs font-medium text-muted">{feature.author.name}</p>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted">{feature.headline || feature.book.verdict}</p>
              <span className="mt-3 inline-flex items-center text-xs font-bold text-brand">Vezi recomandarea <ArrowRight aria-hidden="true" className="ms-1 size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function EditionDetail({ icon: Icon, label }: { icon: typeof BookOpen; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="sr-only">Detaliu ediție</dt>
      <dd className="inline-flex items-center gap-2"><Icon aria-hidden="true" className="size-4 text-brand" />{label}</dd>
    </div>
  );
}

function EditorialPoint({ icon: Icon, title, text }: { icon: typeof Star; title: string; text: string | null }) {
  return (
    <div className="grid grid-cols-[2.25rem_1fr] gap-3">
      <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#ecebdd] text-brand"><Icon aria-hidden="true" className="size-4" /></span>
      <div>
        <h3 className="font-display text-xl font-semibold leading-tight">{title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{text}</p>
      </div>
    </div>
  );
}

function publicationLabel(publicationDate: string | null, publicationYear: number | null) {
  if (publicationDate) {
    return `Publicată la ${new Intl.DateTimeFormat("ro-RO", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(`${publicationDate}T12:00:00Z`))}`;
  }
  return publicationYear ? `Publicată în ${publicationYear}` : null;
}
