import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PublicEmptyState } from "@/components/editorial/public-empty-state";
import { PublicPageHeader } from "@/components/editorial/public-page-header";
import { listPublicEditors } from "@/db/queries/public-trust";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPublicMetadata({
  title: "Echipa editorială",
  description: "Editorii care își asumă selecțiile și analizele publicate pe CarteaZilei.",
  canonical: "/echipa",
});

export default async function TeamPage() {
  const editors = await listPublicEditors();
  return (
    <div>
      <PublicPageHeader eyebrow="Echipa" title="Oamenii din spatele recomandărilor" description="Cunoaște editorii care aleg cărțile și explică motivele fiecărei recomandări." currentLabel="Echipa" currentPath="/echipa" />
      <section className="py-16 md:py-24"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        {editors.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{editors.map((editor) => <Link key={editor.id} href={`/editor/${editor.slug}`} className="group rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"><EditorPortrait editor={editor} /><h2 className="mt-5 font-display text-3xl font-semibold">{editor.name}</h2><p className="mt-4 line-clamp-4 text-sm leading-6 text-muted">{editor.bio}</p>{editor.expertise.length ? <div className="mt-5 flex flex-wrap gap-2">{editor.expertise.slice(0, 4).map((item) => <span key={item} className="rounded-full bg-paper px-3 py-1 text-xs font-bold text-muted">{item}</span>)}</div> : null}<p className="mt-5 text-xs font-bold uppercase tracking-wide text-accent-dark">{editor.reviewCount} analize · {editor.dailyFeatureCount} selecții zilnice</p></Link>)}</div> : <PublicEmptyState title="Echipa va apărea aici" description="Până adăugăm profilurile editorilor, poți descoperi proiectul și felul în care alegem cărțile."><Link href="/despre" className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover">Despre Cartea Zilei</Link></PublicEmptyState>}
      </div></section>
    </div>
  );
}

function EditorPortrait({ editor }: { editor: Awaited<ReturnType<typeof listPublicEditors>>[number] }) {
  if (editor.avatar.id && editor.avatar.altText && editor.avatar.width && editor.avatar.height) {
    return <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-paper"><Image src={`/media/${editor.avatar.id}`} alt={editor.avatar.altText} fill sizes="(min-width: 1024px) 360px, 90vw" className="object-cover" /></div>;
  }
  return <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-accent-soft font-display text-6xl font-semibold text-brand" aria-hidden="true">{editor.name.slice(0, 1).toUpperCase()}</div>;
}
