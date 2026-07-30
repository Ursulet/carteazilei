import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Breadcrumbs } from "@/components/editorial/breadcrumbs";
import { PublicBookCard } from "@/components/editorial/public-book-card";
import { getPublicEditorProfile } from "@/db/queries/public-trust";
import { formatEditorialDate } from "@/domain/editorial/bucharest-date";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildMissingMetadata, buildPublicMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, profilePageJsonLd } from "@/lib/seo/schema";

export const dynamic = "force-dynamic";
const getEditor = cache(getPublicEditorProfile);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getEditor(slug);
  if (!page) return buildMissingMetadata("Pagină de editor");
  const title = `${page.editor.name} — Editor CarteaZilei`;
  const description = page.editor.bio?.slice(0, 160) || `Profilul editorial și selecțiile semnate de ${page.editor.name}.`;
  return buildPublicMetadata({ title, description, canonical: `/editor/${page.editor.slug}` });
}

export default async function EditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getEditor(slug);
  if (!page) notFound();
  const { editor } = page;
  const canonical = `/editor/${editor.slug}`;
  const structuredProfile = profilePageJsonLd({
    name: editor.name,
    description: editor.bio,
    path: canonical,
    image: editor.avatar.id ? `/media/${editor.avatar.id}` : undefined,
    role: "Editor CarteaZilei",
  });
  const structuredBreadcrumbs = breadcrumbJsonLd([
    { name: "Acasă", path: "/" },
    { name: "Echipa", path: "/echipa" },
    { name: editor.name, path: canonical },
  ]);

  return (
    <div>
      <JsonLd data={structuredProfile} />
      <JsonLd data={structuredBreadcrumbs} />
      <header className="border-b border-border bg-surface py-12 md:py-20"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: "Echipa", href: "/echipa" }, { label: editor.name }]} /><div className="mt-10 grid gap-8 md:grid-cols-[12rem_minmax(0,1fr)] md:items-center">{editor.avatar.id && editor.avatar.altText && editor.avatar.width && editor.avatar.height ? <div className="relative aspect-square overflow-hidden rounded-2xl bg-paper"><Image src={`/media/${editor.avatar.id}`} alt={editor.avatar.altText} fill sizes="192px" className="object-cover" priority /></div> : <div className="flex aspect-square items-center justify-center rounded-2xl bg-accent-soft font-display text-7xl font-semibold text-brand" aria-hidden="true">{editor.name.slice(0, 1).toUpperCase()}</div>}<div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Editor CarteaZilei</p><h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">{editor.name}</h1><p className="mt-6 max-w-3xl whitespace-pre-line text-lg leading-8 text-muted">{editor.bio}</p>{editor.expertise.length ? <div className="mt-6 flex flex-wrap gap-2">{editor.expertise.map((item) => <span key={item} className="rounded-full border border-border bg-paper px-3 py-1.5 text-xs font-bold">{item}</span>)}</div> : null}</div></div></div></header>
      {page.reviewedBooks.length ? <section className="py-16 md:py-24"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Analize publicate</p><h2 className="mt-3 font-display text-4xl font-semibold">Cărți analizate</h2><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{page.reviewedBooks.map((book) => <PublicBookCard key={book.id} book={book} />)}</div></div></section> : null}
      {page.dailySelections.length ? <section className="border-y border-border bg-surface py-16"><div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8"><h2 className="font-display text-4xl font-semibold">Selecții Cartea Zilei</h2><div className="mt-7 grid gap-4 sm:grid-cols-2">{page.dailySelections.map((selection) => <Link key={selection.id} href={`/cartea-zilei/${selection.date}`} className="rounded-2xl border border-border bg-paper p-5"><p className="text-xs font-bold uppercase tracking-wide text-accent-dark">{formatEditorialDate(selection.date)}</p><h3 className="mt-2 font-display text-2xl font-semibold">{selection.title}</h3>{selection.headline ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{selection.headline}</p> : null}</Link>)}</div></div></section> : null}
      {page.lists.length ? <section className="py-16 md:py-24"><div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8"><h2 className="font-display text-4xl font-semibold">Liste și ghiduri</h2><div className="mt-7 grid gap-4 sm:grid-cols-2">{page.lists.map((list) => <Link key={list.href} href={list.href} className="rounded-2xl border border-border bg-surface p-5"><p className="text-xs font-bold uppercase tracking-wide text-accent-dark">{list.selections.length} cărți</p><h3 className="mt-2 font-display text-2xl font-semibold">{list.list.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{list.list.intro}</p></Link>)}</div></div></section> : null}
    </div>
  );
}
