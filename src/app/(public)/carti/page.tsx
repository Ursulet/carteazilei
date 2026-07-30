import type { Metadata } from "next";
import Link from "next/link";

import { PublicBookCard } from "@/components/editorial/public-book-card";
import { PublicEmptyState } from "@/components/editorial/public-empty-state";
import { PublicPageHeader } from "@/components/editorial/public-page-header";
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
  return <><PublicPageHeader eyebrow="Catalog" title="Cărți care merită descoperite" description="Răsfoiește titlurile, citește pe scurt de ce merită și vezi cui i s-ar potrivi fiecare carte." currentLabel="Cărți" currentPath="/carti" /><section className="py-16 md:py-24"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">{books.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{books.map((book) => <PublicBookCard key={book.id} book={book} />)}</div> : <PublicEmptyState title="Găsește următoarea lectură" description="Catalogul nu are încă titluri publice. Recomandările vor apărea aici pe măsură ce sunt adăugate."><Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Înapoi la pagina principală</Link></PublicEmptyState>}</div></section></>;
}
