import type { Metadata } from "next";
import Link from "next/link";

import { BookCover } from "@/components/editorial/book-cover";
import { Breadcrumbs } from "@/components/editorial/breadcrumbs";
import {
  getDailyArchiveFilterOptions,
  listPublicDailyFeatures,
  type DailyArchiveFilters,
  type DailyArchiveItem,
} from "@/db/queries/public-daily-features";
import { formatEditorialDate } from "@/domain/editorial/bucharest-date";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(searchParams: SearchParams): DailyArchiveFilters {
  const yearValue = firstValue(searchParams.an);
  const monthValue = firstValue(searchParams.luna);
  const genreValue = firstValue(searchParams.gen);
  const editorValue = firstValue(searchParams.editor);
  const year = yearValue && /^20\d{2}$/.test(yearValue) ? Number(yearValue) : undefined;
  const month = monthValue && /^(?:[1-9]|1[0-2])$/.test(monthValue) ? Number(monthValue) : undefined;
  const genre = genreValue && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(genreValue) ? genreValue : undefined;
  const editorId = editorValue && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(editorValue) ? editorValue : undefined;
  return { year, month, genre, editorId };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const params = await searchParams;
  const filtered = Boolean(params.an || params.luna || params.gen || params.editor);
  return buildPublicMetadata({
    title: "Arhiva Cartea Zilei",
    description: "Toate selecțiile editoriale Cartea Zilei, păstrate cronologic și grupate pe lună și an.",
    canonical: "/cartea-zilei/arhiva",
    index: !filtered,
  });
}

function groupByMonth(rows: DailyArchiveItem[]) {
  const groups = new Map<string, DailyArchiveItem[]>();
  for (const row of rows) {
    const key = row.featureDate.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.entries()];
}

function monthHeading(key: string) {
  return new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric", timeZone: "Europe/Bucharest" }).format(new Date(`${key}-15T12:00:00+03:00`));
}

const monthOptions = Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: new Intl.DateTimeFormat("ro-RO", { month: "long" }).format(new Date(Date.UTC(2024, index, 1))) }));

export default async function DailyArchivePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const [rows, options] = await Promise.all([listPublicDailyFeatures(filters), getDailyArchiveFilterOptions()]);
  const groups = groupByMonth(rows);
  return (
    <>
      <section className="border-b border-border py-12 md:py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: "Cartea Zilei", href: "/cartea-zilei" }, { label: "Arhivă" }]} currentPath="/cartea-zilei/arhiva" />
          <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Istoric editorial</p>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">Arhiva Cartea Zilei</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">Răsfoiește recomandările anterioare și deschide analiza completă a oricărei cărți.</p>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <form action="/cartea-zilei/arhiva" method="get" className="grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-5" aria-label="Filtrează arhiva">
            <label className="text-sm font-bold">An<select name="an" defaultValue={filters.year ?? ""} className="mt-2 w-full rounded-xl border border-border bg-paper px-3 py-2.5 font-normal"><option value="">Toți anii</option>{options.years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
            <label className="text-sm font-bold">Lună<select name="luna" defaultValue={filters.month ?? ""} className="mt-2 w-full rounded-xl border border-border bg-paper px-3 py-2.5 font-normal"><option value="">Toate lunile</option>{monthOptions.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}</select></label>
            <label className="text-sm font-bold">Gen<select name="gen" defaultValue={filters.genre ?? ""} className="mt-2 w-full rounded-xl border border-border bg-paper px-3 py-2.5 font-normal"><option value="">Toate genurile</option>{options.genres.map((genre) => <option key={genre.slug} value={genre.slug}>{genre.name}</option>)}</select></label>
            <label className="text-sm font-bold">Editor<select name="editor" defaultValue={filters.editorId ?? ""} className="mt-2 w-full rounded-xl border border-border bg-paper px-3 py-2.5 font-normal"><option value="">Toți editorii</option>{options.editors.map((editor) => <option key={editor.id} value={editor.id}>{editor.name}</option>)}</select></label>
            <div className="flex items-end gap-2"><button type="submit" className="min-h-11 rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover">Aplică</button><Link href="/cartea-zilei/arhiva" className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-bold hover:border-brand">Resetează</Link></div>
          </form>
        </div>
      </section>

      <section className="pb-16 md:pb-24 lg:pb-28">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-5 sm:px-6 lg:px-8">
          {groups.length ? groups.map(([month, entries]) => <section key={month}><h2 className="border-b border-border pb-4 font-display text-3xl font-semibold capitalize">{monthHeading(month)}</h2><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{entries.map((feature) => <article key={feature.id} className="overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"><Link href={`/cartea-zilei/${feature.featureDate}`} className="block p-5"><BookCover cover={feature.cover} title={feature.book.title} className="mx-auto max-w-[11rem]" /><p className="mt-5 text-xs font-bold uppercase tracking-wide text-accent-dark">{formatEditorialDate(feature.featureDate)}</p><h3 className="mt-2 font-display text-2xl font-semibold leading-tight">{feature.book.title}</h3><p className="mt-1 text-sm text-muted">de {feature.author.name}</p><p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{feature.whyToday}</p></Link></article>)}</div></section>) : <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center"><h2 className="font-display text-3xl font-semibold">Nu există selecții pentru aceste filtre.</h2><p className="mt-3 text-sm text-muted">Schimbă filtrele sau revino la arhiva completă.</p><Link href="/cartea-zilei/arhiva" className="mt-6 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Vezi toată arhiva</Link></div>}
        </div>
      </section>
    </>
  );
}
