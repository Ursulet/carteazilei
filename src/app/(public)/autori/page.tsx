import type { Metadata } from "next";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

import { AuthorPortrait } from "@/components/editorial/author-portrait";
import { PublicEmptyState } from "@/components/editorial/public-empty-state";
import { PublicPageHeader } from "@/components/editorial/public-page-header";
import { listPublicAuthors } from "@/db/queries/public-author-pages";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPublicMetadata({
  title: "Autori",
  description: "Profiluri de autor, cărți analizate și puncte de intrare în operă.",
  canonical: "/autori",
});

export default async function AuthorsPage() {
  const authors = await listPublicAuthors();
  return (
    <>
      <PublicPageHeader eyebrow="Autori" title="Descoperă autorii din catalog" description="Pornește de la un autor pentru a găsi cărțile și recomandările asociate." currentLabel="Autori" currentPath="/autori" />
      <section className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          {authors.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {authors.map((author) => (
                <Link key={author.id} href={`/autor/${author.slug}`} className="group grid grid-cols-[7.5rem_minmax(0,1fr)] gap-5 rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-rust hover:shadow-md">
                  <AuthorPortrait portrait={author.portrait} name={author.name} className="w-full rounded-xl shadow-md" />
                  <div className="min-w-0 py-2">
                    <h2 className="font-display text-2xl font-semibold leading-tight text-rust">{author.name}</h2>
                    {author.bio ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{author.bio}</p> : null}
                    <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rust-dark"><BookOpen aria-hidden="true" className="size-4" />{author.bookCount} {author.bookCount === 1 ? "carte" : "cărți"}</p>
                    <span className="mt-3 flex items-center text-xs font-bold text-brand">Vezi profilul <ArrowRight aria-hidden="true" className="ms-1 size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <PublicEmptyState title="Descoperă catalogul de cărți" description="Nu avem încă profiluri de autor de afișat. Poți explora direct cărțile disponibile."><Link href="/carti" className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover">Vezi cărțile</Link></PublicEmptyState>
          )}
        </div>
      </section>
    </>
  );
}
