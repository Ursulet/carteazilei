import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/editorial/breadcrumbs";
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
    <main>
      <header className="border-b border-border bg-surface py-12 md:py-20"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8"><Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: "Echipa" }]} /><p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Responsabilitate editorială</p><h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">Oamenii din spatele selecțiilor</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-muted">Afișăm numai profile activate explicit și completate cu biografie. Nu inventăm comitete, titluri sau validări.</p></div></header>
      <section className="py-16 md:py-24"><div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        {editors.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{editors.map((editor) => <Link key={editor.id} href={`/editor/${editor.slug}`} className="group rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"><EditorPortrait editor={editor} /><h2 className="mt-5 font-display text-3xl font-semibold">{editor.name}</h2><p className="mt-4 line-clamp-4 text-sm leading-6 text-muted">{editor.bio}</p>{editor.expertise.length ? <div className="mt-5 flex flex-wrap gap-2">{editor.expertise.slice(0, 4).map((item) => <span key={item} className="rounded-full bg-paper px-3 py-1 text-xs font-bold text-muted">{item}</span>)}</div> : null}<p className="mt-5 text-xs font-bold uppercase tracking-wide text-accent-dark">{editor.reviewCount} analize · {editor.dailyFeatureCount} selecții zilnice</p></Link>)}</div> : <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center"><h2 className="font-display text-3xl font-semibold">Profilele editoriale sunt în pregătire.</h2><p className="mt-3 text-sm text-muted">Un profil apare numai după ce este completat și activat explicit în admin.</p></div>}
      </div></section>
    </main>
  );
}

function EditorPortrait({ editor }: { editor: Awaited<ReturnType<typeof listPublicEditors>>[number] }) {
  if (editor.avatar.id && editor.avatar.altText && editor.avatar.width && editor.avatar.height) {
    return <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-paper"><Image src={`/media/${editor.avatar.id}`} alt={editor.avatar.altText} fill sizes="(min-width: 1024px) 360px, 90vw" className="object-cover" /></div>;
  }
  return <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-accent-soft font-display text-6xl font-semibold text-brand" aria-hidden="true">{editor.name.slice(0, 1).toUpperCase()}</div>;
}
