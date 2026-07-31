import type { Metadata } from "next";
import { ArrowDown, BookOpen, ChevronDown, Filter, RotateCcw, Search } from "lucide-react";
import Link from "next/link";

import { PublicBookCard } from "@/components/editorial/public-book-card";
import { PublicEmptyState } from "@/components/editorial/public-empty-state";
import { PublicPageHeader } from "@/components/editorial/public-page-header";
import {
  countPublicBookCatalog,
  getPublicBookCatalogFilterOptions,
  listPublicBookCatalog,
  type PublicBookCatalogFilters,
  type PublicBookCatalogSort,
} from "@/db/queries/public-book-pages";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPublicMetadata({
  title: "Cărți analizate editorial",
  description: "Cărți publicate numai după verificarea verdictului, ediției, limitelor și profilului editorial.",
  canonical: "/carti",
});

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function selectedValues(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))].slice(0, 50);
}

function parseFilters(params: SearchParams): PublicBookCatalogFilters {
  const requestedSort = firstValue(params.ordonare);
  const sort: PublicBookCatalogSort = requestedSort === "author" || requestedSort === "recent" ? requestedSort : "title";
  return {
    q: firstValue(params.q)?.trim().slice(0, 120),
    genres: selectedValues(params.gen),
    themes: selectedValues(params.tema),
    moods: selectedValues(params.stare),
    audiences: selectedValues(params.pentru),
    sort,
  };
}

function parseVisibleCount(params: SearchParams) {
  const value = Number(firstValue(params.afiseaza));
  if (!Number.isInteger(value) || value < 8) return 8;
  return Math.min(Math.ceil(value / 8) * 8, 50_000);
}

function loadMoreHref(params: SearchParams, visibleCount: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "afiseaza" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
  }
  query.set("afiseaza", String(visibleCount + 8));
  return `/carti?${query.toString()}`;
}

export default async function BooksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const visibleCount = parseVisibleCount(params);
  const [books, totalBooks, options] = await Promise.all([
    listPublicBookCatalog(filters, visibleCount),
    countPublicBookCatalog(filters),
    getPublicBookCatalogFilterOptions(),
  ]);
  const activeFilterCount = Number(Boolean(filters.q))
    + (filters.genres?.length ?? 0)
    + (filters.themes?.length ?? 0)
    + (filters.moods?.length ?? 0)
    + (filters.audiences?.length ?? 0);
  const activeTaxonomyLabels = [
    ...options.genres.filter((option) => filters.genres?.includes(option.slug)),
    ...options.themes.filter((option) => filters.themes?.includes(option.slug)),
    ...options.moods.filter((option) => filters.moods?.includes(option.slug)),
    ...options.audiences.filter((option) => filters.audiences?.includes(option.slug)),
  ].map((option) => option.name);

  return (
    <>
      <PublicPageHeader
        eyebrow="Catalog"
        title="Toate cărțile"
        description="Explorează întregul catalog sau filtrează cărțile după gen, temă, atmosferă și cititorul căruia i se potrivesc."
        currentLabel="Cărți"
        currentPath="/carti"
        compact
      />
      <section className="py-6 md:py-8">
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-6 lg:px-8">
          <form action="/carti" method="get" className="relative rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem_auto] md:items-end">
              <label className="text-sm font-bold">
                Caută în catalog
                <span className="relative mt-1.5 block">
                  <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <input name="q" type="search" defaultValue={filters.q} placeholder="Titlu sau autor" className="min-h-11 w-full rounded-xl border border-border bg-paper py-2.5 pe-4 ps-11 font-normal outline-none transition focus:border-brand" />
                </span>
              </label>
              <label className="text-sm font-bold">
                Ordonează
                <select name="ordonare" defaultValue={filters.sort} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-paper px-3 font-normal outline-none transition focus:border-brand">
                  <option value="title">Titlu A–Z</option>
                  <option value="author">Autor A–Z</option>
                  <option value="recent">Adăugate recent</option>
                </select>
              </label>
              <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-hover">
                <Filter aria-hidden="true" className="me-2 size-4" />Aplică
              </button>
            </div>

            {options.genres.length || options.themes.length || options.moods.length || options.audiences.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 sm:flex sm:flex-wrap sm:items-center">
                <span className="col-span-2 me-1 hidden text-xs font-bold uppercase tracking-wide text-muted sm:inline">Filtre:</span>
                <FilterGroup title="Genuri" name="gen" options={options.genres} selected={filters.genres ?? []} />
                <FilterGroup title="Teme" name="tema" options={options.themes} selected={filters.themes ?? []} />
                <FilterGroup title="Atmosferă" name="stare" options={options.moods} selected={filters.moods ?? []} />
                <FilterGroup title="Pentru cine" name="pentru" options={options.audiences} selected={filters.audiences ?? []} />
              </div>
            ) : (
              <p className="mt-6 border-t border-border pt-5 text-sm text-muted">
                Cărțile publicate nu au încă genuri, teme, atmosfere sau audiențe asociate.
              </p>
            )}

            {activeFilterCount ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                {activeTaxonomyLabels.slice(0, 6).map((label, index) => <span key={`${label}-${index}`} className="rounded-full bg-rust-soft px-3 py-1 text-xs font-semibold text-rust-dark">{label}</span>)}
                {activeTaxonomyLabels.length > 6 ? <span className="text-xs font-semibold text-muted">+{activeTaxonomyLabels.length - 6}</span> : null}
                <Link href="/carti" className="inline-flex items-center text-sm font-bold text-rust-dark hover:text-rust">
                  <RotateCcw aria-hidden="true" className="me-1.5 size-3.5" />Șterge filtrele
                </Link>
              </div>
            ) : null}
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 font-display text-3xl font-semibold">
              <BookOpen aria-hidden="true" className="size-6 text-rust" />
              {activeFilterCount ? "Rezultatele filtrării" : "Catalogul complet"}
            </h2>
            <p className="text-sm font-semibold text-muted">{totalBooks} {totalBooks === 1 ? "carte" : "cărți"}</p>
          </div>

          {books.length ? (
            <>
              <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books.map((book) => <PublicBookCard key={book.id} book={book} />)}
              </div>
              {books.length < totalBooks ? (
                <div className="mt-10 flex justify-center">
                  <Link href={loadMoreHref(params, visibleCount)} scroll={false} className="inline-flex min-h-12 items-center justify-center rounded-full border border-brand px-7 text-sm font-bold text-brand transition hover:bg-brand hover:text-white">
                    Vezi încă 8 cărți <ArrowDown aria-hidden="true" className="ms-2 size-4" />
                  </Link>
                </div>
              ) : null}
            </>
          ) : activeFilterCount ? (
            <div className="mt-7">
              <PublicEmptyState title="Nu am găsit cărți pentru aceste filtre" description="Încearcă să debifezi unul dintre criterii sau să cauți după alt titlu ori autor.">
                <Link href="/carti" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Vezi toate cărțile</Link>
              </PublicEmptyState>
            </div>
          ) : (
            <div className="mt-7">
              <PublicEmptyState title="Găsește următoarea lectură" description="Catalogul nu are încă titluri publice. Recomandările vor apărea aici pe măsură ce sunt adăugate.">
                <Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Înapoi la pagina principală</Link>
              </PublicEmptyState>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function FilterGroup({ title, name, options, selected }: {
  title: string;
  name: string;
  options: Array<{ name: string; slug: string; count: number }>;
  selected: string[];
}) {
  if (!options.length) return null;
  const selectedSet = new Set(selected);
  return (
    <details className="group relative min-w-0 [&[open]]:col-span-2">
      <summary className={`flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-full border px-4 text-sm font-semibold transition [&::-webkit-details-marker]:hidden ${selected.length ? "border-rust/40 bg-rust-soft text-rust-dark" : "border-border bg-paper hover:border-rust/50"}`}>
        <span>{title}{selected.length ? ` (${selected.length})` : ""}</span>
        <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <fieldset className="relative z-30 mt-2 w-full rounded-2xl border border-border bg-surface p-3 shadow-xl sm:absolute sm:start-0 sm:w-72">
        <legend className="sr-only">{title}</legend>
        <div className="grid max-h-64 gap-0.5 overflow-y-auto pe-1">
          {options.map((option) => (
            <label key={option.slug} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition hover:bg-paper">
              <input type="checkbox" name={name} value={option.slug} defaultChecked={selectedSet.has(option.slug)} className="size-4 shrink-0 accent-[var(--brand)]" />
              <span className="min-w-0 flex-1">{option.name}</span>
              <span className="text-xs tabular-nums text-muted">{option.count}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </details>
  );
}
