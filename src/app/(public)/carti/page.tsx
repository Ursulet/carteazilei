import type { Metadata } from "next";
import { ArrowDown, BookOpen, Filter, RotateCcw, Search } from "lucide-react";
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

  return (
    <>
      <PublicPageHeader
        eyebrow="Catalog"
        title="Toate cărțile"
        description="Explorează întregul catalog sau filtrează cărțile după gen, temă, atmosferă și cititorul căruia i se potrivesc."
        currentLabel="Cărți"
        currentPath="/carti"
      />
      <section className="py-12 md:py-16">
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-6 lg:px-8">
          <form action="/carti" method="get" className="rounded-[1.5rem] border border-border bg-surface p-4 shadow-sm sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem_auto] lg:items-end">
              <label className="text-sm font-bold">
                Caută în catalog
                <span className="relative mt-2 block">
                  <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <input name="q" type="search" defaultValue={filters.q} placeholder="Titlu sau autor" className="min-h-12 w-full rounded-xl border border-border bg-paper py-3 pe-4 ps-11 font-normal outline-none transition focus:border-brand" />
                </span>
              </label>
              <label className="text-sm font-bold">
                Ordonează
                <select name="ordonare" defaultValue={filters.sort} className="mt-2 min-h-12 w-full rounded-xl border border-border bg-paper px-4 font-normal outline-none transition focus:border-brand">
                  <option value="title">Titlu A–Z</option>
                  <option value="author">Autor A–Z</option>
                  <option value="recent">Adăugate recent</option>
                </select>
              </label>
              <button type="submit" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand-hover">
                <Filter aria-hidden="true" className="me-2 size-4" />Aplică filtrele
              </button>
            </div>

            {options.genres.length || options.themes.length || options.moods.length || options.audiences.length ? (
              <div className="mt-6 grid gap-4 border-t border-border pt-6 md:grid-cols-2 xl:grid-cols-4">
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
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <p className="text-sm text-muted">{activeFilterCount} {activeFilterCount === 1 ? "filtru activ" : "filtre active"}</p>
                <Link href="/carti" className="inline-flex items-center text-sm font-bold text-rust-dark hover:text-rust">
                  <RotateCcw aria-hidden="true" className="me-2 size-4" />Șterge filtrele
                </Link>
              </div>
            ) : null}
          </form>

          <div className="mt-9 flex flex-wrap items-center justify-between gap-3">
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
    <fieldset className="rounded-2xl border border-border bg-paper/55 p-4">
      <legend className="px-1 font-display text-xl font-semibold">{title}</legend>
      <div className="mt-2 grid max-h-52 gap-1 overflow-y-auto pe-1">
        {options.map((option) => (
          <label key={option.slug} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition hover:bg-surface">
            <input type="checkbox" name={name} value={option.slug} defaultChecked={selectedSet.has(option.slug)} className="size-4 shrink-0 accent-[var(--brand)]" />
            <span className="min-w-0 flex-1">{option.name}</span>
            <span className="text-xs tabular-nums text-muted">{option.count}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
