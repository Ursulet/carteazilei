import type { Metadata } from "next";
import { BookOpen, LibraryBig, Search, UserRound } from "lucide-react";
import Link from "next/link";

import { AuthorLink } from "@/components/editorial/author-link";
import { BookCover } from "@/components/editorial/book-cover";
import { Breadcrumbs } from "@/components/editorial/breadcrumbs";
import { getPublicHomepageDiscovery } from "@/db/queries/public-home";
import { searchPublicCatalog, type PublicSearchResults } from "@/db/queries/public-search";
import {
  readPublicSearchQuery,
  SEARCH_QUERY_MAXIMUM_LENGTH,
} from "@/domain/search/input";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPublicMetadata({
  title: "Caută",
  description: "Caută în catalogul editorial CarteaZilei după carte, autor sau temă.",
  canonical: "/cauta",
  index: false,
});

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

const emptyResults: PublicSearchResults = { books: [], authors: [], guides: [] };

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const parameters = await searchParams;
  const rawQuery = Array.isArray(parameters.q) ? parameters.q[0] : parameters.q;
  const fieldValue = (rawQuery ?? "").slice(0, SEARCH_QUERY_MAXIMUM_LENGTH);
  const query = readPublicSearchQuery(parameters.q);
  const results = query
    ? await searchPublicCatalog(query, { bookLimit: 24, authorLimit: 12, guideLimit: 12 })
    : emptyResults;
  const resultCount = results.books.length + results.authors.length + results.guides.length;
  const discovery = !query || resultCount === 0 ? await getPublicHomepageDiscovery() : null;

  return (
    <>
      <header className="border-b border-border bg-surface py-12 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: "Căutare" }]} currentPath="/cauta" />
          <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Descoperă în catalog</p>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">
            Caută o carte, un autor sau o temă
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">
            Căutarea ignoră diferențele de diacritice și tolerează greșelile mici de scriere.
          </p>

          <form action="/cauta" method="get" role="search" className="mt-9 flex max-w-3xl items-center gap-3 rounded-2xl border border-border bg-background px-4 shadow-sm focus-within:border-brand">
            <Search aria-hidden="true" className="size-5 shrink-0 text-muted" />
            <label htmlFor="catalog-query" className="sr-only">Caută o carte, un autor sau o temă</label>
            <input
              id="catalog-query"
              name="q"
              type="search"
              defaultValue={fieldValue}
              maxLength={SEARCH_QUERY_MAXIMUM_LENGTH}
              placeholder="Caută o carte, un autor sau o temă"
              className="min-h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
            />
            <button type="submit" className="my-1.5 inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover">
              Caută
            </button>
          </form>
        </div>
      </header>

      <main className="py-14 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          {query ? (
            resultCount ? (
              <SearchResults query={query} results={results} />
            ) : (
              <NoResults query={query} discovery={discovery} />
            )
          ) : (
            <SearchStartingPoints discovery={discovery} hasInvalidQuery={Boolean(rawQuery)} />
          )}
        </div>
      </main>
    </>
  );
}

function SearchResults({ query, results }: { query: string; results: PublicSearchResults }) {
  const total = results.books.length + results.authors.length + results.guides.length;

  return (
    <div className="space-y-16">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-accent-dark">{total} {total === 1 ? "rezultat" : "rezultate"}</p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em]">Pentru „{query}”</h2>
      </div>

      {results.books.length ? (
        <section aria-labelledby="search-books-heading">
          <SearchSectionHeading id="search-books-heading" icon={<BookOpen aria-hidden="true" className="size-5" />} title="Cărți" count={results.books.length} />
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.books.map((book) => (
              <article key={book.id} className="group rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm">
                <Link href={`/carte/${book.slug}`} className="block">
                  <BookCover cover={book.cover} title={book.title} className="mx-auto max-w-[11rem]" />
                  <h3 className="mt-5 font-display text-2xl font-semibold leading-tight">{book.title}</h3>
                </Link>
                <p className="mt-1 text-sm text-muted">de <AuthorLink name={book.author} slug={book.authorSlug} /></p>
                {book.verdict ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{book.verdict}</p> : null}
                <Link href={`/carte/${book.slug}`} className="mt-5 inline-flex text-sm font-bold text-brand">Vezi analiza →</Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {results.authors.length ? (
        <section aria-labelledby="search-authors-heading">
          <SearchSectionHeading id="search-authors-heading" icon={<UserRound aria-hidden="true" className="size-5" />} title="Autori" count={results.authors.length} />
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.authors.map((author) => (
              <Link key={author.id} href={`/autor/${author.slug}`} className="rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm">
                <h3 className="font-display text-3xl font-semibold text-rust">{author.name}</h3>
                {author.bio ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{author.bio}</p> : null}
                <p className="mt-5 text-xs font-bold uppercase tracking-wide text-accent-dark">
                  {author.bookCount} {author.bookCount === 1 ? "carte analizată" : "cărți analizate"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {results.guides.length ? (
        <section aria-labelledby="search-guides-heading">
          <SearchSectionHeading id="search-guides-heading" icon={<LibraryBig aria-hidden="true" className="size-5" />} title="Liste / ghiduri" count={results.guides.length} />
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.guides.map((guide) => (
              <Link key={guide.id} href={guide.href} className="rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">{guide.kindLabel} · {guide.selectionCount} cărți</p>
                <h3 className="mt-3 font-display text-3xl font-semibold">{guide.title}</h3>
                {guide.intro ? <p className="mt-4 line-clamp-4 leading-7 text-muted">{guide.intro}</p> : null}
                <span className="mt-6 inline-flex text-sm font-bold text-brand">Vezi selecția →</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SearchSectionHeading({ id, icon, title, count }: { id: string; icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center gap-3 border-b border-border pb-4">
      <span className="text-accent-dark">{icon}</span>
      <h2 id={id} className="font-display text-3xl font-semibold">{title}</h2>
      <span className="ms-auto rounded-full bg-accent-soft px-3 py-1 text-xs font-bold">{count}</span>
    </div>
  );
}

function NoResults({ query, discovery }: { query: string; discovery: Awaited<ReturnType<typeof getPublicHomepageDiscovery>> | null }) {
  return (
    <div>
      <section className="rounded-3xl border border-dashed border-border bg-surface px-6 py-14 text-center">
        <h2 className="font-display text-4xl font-semibold">Nu am găsit rezultate pentru „{query}”.</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted">
          Încearcă un titlu mai scurt, numele autorului sau o temă generală. Dacă vrei o alegere construită după preferințele tale, folosește recomandarea personalizată.
        </p>
        <Link href="/recomanda-mi" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover">
          Recomandă-mi o carte
        </Link>
      </section>
      <SearchStartingPoints discovery={discovery} />
    </div>
  );
}

function SearchStartingPoints({
  discovery,
  hasInvalidQuery = false,
}: {
  discovery: Awaited<ReturnType<typeof getPublicHomepageDiscovery>> | null;
  hasInvalidQuery?: boolean;
}) {
  const hubs = [
    ...(discovery?.genres.map((item) => ({ label: "Gen", title: item.name, href: `/carti/gen/${item.slug}` })) ?? []),
    ...(discovery?.moods.map((item) => ({ label: "Stare", title: item.name, href: `/carti/stare/${item.slug}` })) ?? []),
    ...(discovery?.audiences.map((item) => ({ label: "Pentru cine", title: item.name, href: `/carti/pentru/${item.slug}` })) ?? []),
    ...(discovery?.lists.map((item) => ({ label: "Listă editorială", title: item.title, href: `/liste/${item.slug}` })) ?? []),
  ].slice(0, 12);

  return (
    <section className="mt-14" aria-labelledby="search-start-heading">
      {hasInvalidQuery ? <p className="mb-7 rounded-2xl border border-border bg-surface p-4 text-sm text-muted">Introdu cel puțin două caractere și maximum {SEARCH_QUERY_MAXIMUM_LENGTH}.</p> : null}
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Puncte de pornire reale</p>
      <h2 id="search-start-heading" className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em]">Explorează selecțiile publicate</h2>
      <p className="mt-4 max-w-2xl leading-7 text-muted">Nu inventăm căutări sau tendințe. Aici apar numai hub-uri editoriale care au trecut pragurile de publicare.</p>
      {hubs.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hubs.map((hub) => (
            <Link key={hub.href} href={hub.href} className="rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">{hub.label}</p>
              <h3 className="mt-2 font-display text-2xl font-semibold">{hub.title}</h3>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-6 py-10">
          <p className="text-muted">Selecțiile vor apărea după validarea lor editorială.</p>
        </div>
      )}
    </section>
  );
}
