import type { Metadata } from "next";
import { ArrowRight, BookOpen, LibraryBig } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { AuthorPortrait } from "@/components/editorial/author-portrait";
import { Breadcrumbs } from "@/components/editorial/breadcrumbs";
import { PublicBookCard } from "@/components/editorial/public-book-card";
import { getPublicAuthorPage } from "@/db/queries/public-author-pages";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildMissingMetadata, buildPublicMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, profilePageJsonLd } from "@/lib/seo/schema";

export const dynamic = "force-dynamic";
const getAuthor = cache(getPublicAuthorPage);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getAuthor(slug);
  if (!page) return buildMissingMetadata("Pagină de autor");
  const title = page.seo?.title || `${page.name} — cărți analizate și de unde să începi`;
  const description = (page.seo?.description || page.bio || `Cărți de ${page.name} analizate editorial.`).slice(0, 160);
  const canonical = page.seo?.canonical || `/autor/${page.slug}`;
  const qualityIndexable = Boolean(page.bio && page.bio.trim().length >= 100 && page.books.length > 0);
  return buildPublicMetadata({ title, description, canonical, index: page.seo?.indexable ?? qualityIndexable });
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getAuthor(slug);
  if (!page) notFound();

  const canonical = page.seo?.canonical || `/autor/${page.slug}`;
  const structuredProfile = profilePageJsonLd({ name: page.name, description: page.bio, path: canonical, dateModified: page.updatedAt });
  const structuredBreadcrumbs = breadcrumbJsonLd([
    { name: "Acasă", path: "/" },
    { name: "Autori", path: "/autori" },
    { name: page.name, path: canonical },
  ]);

  return (
    <article>
      <JsonLd data={structuredProfile} />
      <JsonLd data={structuredBreadcrumbs} />

      <header className="relative overflow-hidden border-b border-border bg-surface py-10 md:py-16 lg:py-20">
        <div className="absolute -end-32 -top-32 size-96 rounded-full bg-rust-soft/60 blur-3xl" />
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: "Autori", href: "/autori" }, { label: page.name }]} />
          <div className="mt-10 grid items-center gap-8 md:grid-cols-[13rem_minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14">
            <AuthorPortrait portrait={page.portrait} name={page.name} priority className="mx-auto w-44 md:w-full" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-rust-dark">Profil de autor</p>
              <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">{page.name}</h1>
              {page.bio ? <p className="mt-6 max-w-3xl whitespace-pre-line text-base leading-8 text-muted sm:text-lg">{page.bio}</p> : null}
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-paper px-4 py-2 text-sm font-semibold"><BookOpen aria-hidden="true" className="size-4 text-rust" />{page.books.length} {page.books.length === 1 ? "carte analizată" : "cărți analizate"}</span>
                {page.lists.length ? <span className="inline-flex items-center gap-2 rounded-full border border-border bg-paper px-4 py-2 text-sm font-semibold"><LibraryBig aria-hidden="true" className="size-4 text-rust" />{page.lists.length} {page.lists.length === 1 ? "listă editorială" : "liste editoriale"}</span> : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      {page.startHere.length ? (
        <section className="border-b border-border bg-brand py-16 text-white md:py-20">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#efb687]">Ghid de intrare</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em]">De unde să începi cu {page.name}</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{page.startHere.map((book) => <PublicBookCard key={book.id} book={book} reason={book.reason} />)}</div>
          </div>
        </section>
      ) : null}

      <section className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-5">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-rust-dark">Analize publicate</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em]">Cărți de {page.name}</h2></div>
            <Link href="/carti" className="hidden items-center text-sm font-bold text-rust-dark hover:text-rust sm:inline-flex">Toate cărțile <ArrowRight aria-hidden="true" className="ms-2 size-4" /></Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{page.books.map((book) => <PublicBookCard key={book.id} book={book} />)}</div>
        </div>
      </section>

      {page.lists.length ? (
        <section className="border-y border-border bg-surface py-16 md:py-20">
          <div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rust-dark">Context editorial</p>
            <h2 className="mt-3 font-display text-4xl font-semibold">Liste în care apare</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">{page.lists.map((list) => <Link key={list.slug} href={`/liste/${list.slug}`} className="group rounded-2xl border border-border bg-paper p-6 transition hover:-translate-y-0.5 hover:border-rust hover:shadow-sm"><LibraryBig aria-hidden="true" className="size-5 text-rust" /><h3 className="mt-4 font-display text-2xl font-semibold">{list.title}</h3>{list.intro ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{list.intro}</p> : null}<span className="mt-5 inline-flex items-center text-xs font-bold text-brand">Deschide lista <ArrowRight aria-hidden="true" className="ms-1 size-3.5 transition-transform group-hover:translate-x-0.5" /></span></Link>)}</div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
