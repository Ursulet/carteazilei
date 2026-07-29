import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

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
  return buildPublicMetadata({
    title,
    description,
    canonical,
    index: page.seo?.indexable ?? qualityIndexable,
  });
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
      <header className="border-b border-border py-12 md:py-20">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: "Autori", href: "/autori" }, { label: page.name }]} />
          <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Profil editorial de autor</p>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">{page.name}</h1>
          {page.bio ? <p className="mt-7 max-w-3xl whitespace-pre-line text-lg leading-8 text-muted">{page.bio}</p> : null}
        </div>
      </header>

      {page.startHere.length ? <section className="border-b border-border bg-surface py-16 md:py-24"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Ghid de intrare</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em]">De unde să începi cu {page.name}</h2><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{page.startHere.map((book) => <PublicBookCard key={book.id} book={book} reason={book.reason} />)}</div></div></section> : null}

      <section className="py-16 md:py-24"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Analize publicate</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em]">Cărți de {page.name}</h2><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{page.books.map((book) => <PublicBookCard key={book.id} book={book} />)}</div></div></section>

      {page.lists.length ? <section className="border-y border-border bg-surface py-16 md:py-24"><div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Context editorial</p><h2 className="mt-3 font-display text-4xl font-semibold">Liste în care apare</h2><div className="mt-8 grid gap-4 sm:grid-cols-2">{page.lists.map((list) => <Link key={list.slug} href={`/liste/${list.slug}`} className="rounded-2xl border border-border bg-paper p-6 transition hover:border-accent"><h3 className="font-display text-2xl font-semibold">{list.title}</h3>{list.intro ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{list.intro}</p> : null}</Link>)}</div></div></section> : null}

      {page.verifiedFacts || page.sourceNotes ? <section className="py-16 md:py-24"><div className="mx-auto grid w-full max-w-5xl gap-8 px-5 sm:px-6 md:grid-cols-2 lg:px-8">{page.verifiedFacts ? <section><h2 className="font-display text-3xl font-semibold">Date verificate</h2><p className="mt-5 whitespace-pre-line text-base leading-8 text-muted">{page.verifiedFacts}</p></section> : null}{page.sourceNotes ? <section><h2 className="font-display text-3xl font-semibold">Surse</h2><p className="mt-5 whitespace-pre-line text-base leading-8 text-muted">{page.sourceNotes}</p></section> : null}</div></section> : null}
    </article>
  );
}
