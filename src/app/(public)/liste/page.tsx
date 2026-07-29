import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/editorial/breadcrumbs";
import { listPublicEditorialLists } from "@/db/queries/public-seo-hubs";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPublicMetadata({ title: "Liste editoriale", description: "Selecții de cărți argumentate, construite în jurul unei intenții clare.", canonical: "/liste" });

export default async function ListsPage() {
  const lists = await listPublicEditorialLists();
  return (
    <main><header className="border-b border-border bg-surface py-12 md:py-20"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: "Liste" }]} /><p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Selecții tematice</p><h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">Liste scurte, cu un motiv pentru fiecare alegere</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-muted">Publicăm numai liste cu introducere, metodologie, editor și suficiente cărți explicate.</p></div></header><section className="py-16 md:py-24"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">{lists.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{lists.map((page) => <Link key={page.list.id} href={page.href} className="group rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-muted">{page.selections.length} cărți</p><h2 className="mt-3 font-display text-3xl font-semibold">{page.list.title}</h2><p className="mt-4 line-clamp-4 leading-7 text-muted">{page.list.intro}</p><span className="mt-6 inline-flex text-sm font-bold text-brand">Vezi selecția →</span></Link>)}</div> : <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center"><h2 className="font-display text-3xl font-semibold">Listele sunt în pregătire.</h2><p className="mt-3 text-sm text-muted">Vor apărea aici numai după ce trec toate criteriile editoriale și SEO.</p></div>}</div></section></main>
  );
}
