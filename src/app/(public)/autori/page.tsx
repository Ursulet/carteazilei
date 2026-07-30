import type { Metadata } from "next";
import Link from "next/link";

import { PublicEmptyState } from "@/components/editorial/public-empty-state";
import { PublicPageHeader } from "@/components/editorial/public-page-header";
import { listPublicAuthors } from "@/db/queries/public-author-pages";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPublicMetadata({
  title: "Autori",
  description: "Profiluri editoriale de autor, cărți analizate, surse și puncte de intrare în operă.",
  canonical: "/autori",
});

export default async function AuthorsPage() {
  const authors = await listPublicAuthors();
  return <><PublicPageHeader eyebrow="Autori" title="Descoperă autorii din catalog" description="Pornește de la un autor pentru a găsi cărțile, temele și recomandările asociate." currentLabel="Autori" currentPath="/autori" /><section className="py-16 md:py-24"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">{authors.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{authors.map((author) => <Link key={author.id} href={`/autor/${author.slug}`} className="rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"><h2 className="font-display text-3xl font-semibold">{author.name}</h2>{author.bio ? <p className="mt-4 line-clamp-4 text-sm leading-6 text-muted">{author.bio}</p> : null}<p className="mt-5 text-xs font-bold uppercase tracking-wide text-accent-dark">{author.bookCount} {author.bookCount === 1 ? "carte" : "cărți"}</p></Link>)}</div> : <PublicEmptyState title="Descoperă catalogul de cărți" description="Nu avem încă profiluri de autor de afișat. Poți explora direct cărțile disponibile."><Link href="/carti" className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover">Vezi cărțile</Link></PublicEmptyState>}</div></section></>;
}
