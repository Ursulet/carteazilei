import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/editorial/breadcrumbs";
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
  return <><header className="border-b border-border py-12 md:py-20"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: "Autori" }]} /><p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Profiluri verificate</p><h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">Autori din catalogul editorial</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-muted">Biografii, surse și cărți publicate numai când există suficient context editorial.</p></div></header><section className="py-16 md:py-24"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">{authors.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{authors.map((author) => <Link key={author.id} href={`/autor/${author.slug}`} className="rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"><h2 className="font-display text-3xl font-semibold">{author.name}</h2>{author.bio ? <p className="mt-4 line-clamp-4 text-sm leading-6 text-muted">{author.bio}</p> : null}<p className="mt-5 text-xs font-bold uppercase tracking-wide text-accent-dark">{author.bookCount} {author.bookCount === 1 ? "carte analizată" : "cărți analizate"}</p></Link>)}</div> : <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center"><h2 className="font-display text-3xl font-semibold">Profilurile sunt în pregătire.</h2><p className="mt-3 text-sm text-muted">Un autor apare aici după publicarea unei cărți eligibile.</p></div>}</div></section></>;
}
