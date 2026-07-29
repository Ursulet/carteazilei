import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/editorial/breadcrumbs";
import { PublicBookCard } from "@/components/editorial/public-book-card";
import { listPublicBookCards } from "@/db/queries/public-book-pages";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPublicMetadata({
  title: "Cărți analizate editorial",
  description: "Cărți publicate numai după verificarea verdictului, ediției, limitelor și profilului editorial.",
  canonical: "/carti",
});

export default async function BooksPage() {
  const books = await listPublicBookCards();
  return <><header className="border-b border-border py-12 md:py-20"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: "Cărți" }]} /><p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Catalog editorial</p><h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">Cărți analizate, nu doar listate</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-muted">Fiecare pagină publică are un verdict, o ediție verificată și cel puțin o rezervă editorială.</p></div></header><section className="py-16 md:py-24"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">{books.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{books.map((book) => <PublicBookCard key={book.id} book={book} />)}</div> : <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center"><h2 className="font-display text-3xl font-semibold">Catalogul public este în pregătire.</h2><p className="mt-3 text-sm text-muted">Cărțile vor apărea după ce îndeplinesc toate criteriile editoriale.</p></div>}</div></section></>;
}
