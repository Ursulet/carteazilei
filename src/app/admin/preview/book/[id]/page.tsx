import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublishingChecklist } from "@/components/admin/publishing-checklist";
import { getPublishedPreviewBook } from "@/db/queries/admin-editorial";
import { requireSectionAccess } from "@/lib/auth/principal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Previzualizare carte", robots: { index: false, follow: false, nocache: true } };

export default async function BookPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSectionAccess("books");
  const { id } = await params;
  const record = await getPublishedPreviewBook(id);
  if (!record) notFound();
  return (
    <main className="min-h-screen bg-paper px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent bg-surface px-4 py-3 text-sm"><strong>Previzualizare internă — neindexabilă</strong><Link href={`/admin/books/${id}`} className="font-bold underline underline-offset-4">Înapoi la editare</Link></div>
        <article className="grid gap-10 rounded-3xl border border-border bg-surface p-6 shadow-sm md:grid-cols-[minmax(0,1fr)_18rem] md:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Fișă editorială</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-tight">{record.book.title}</h1>
            <p className="mt-3 text-lg text-muted">de {record.author}</p>
            {record.book.shortVerdict ? <p className="mt-8 border-s-4 border-accent ps-5 font-display text-2xl leading-9">{record.book.shortVerdict}</p> : null}
            {record.book.spoilerFreeSummary ? <div className="mt-8 whitespace-pre-line text-base leading-8">{record.book.spoilerFreeSummary}</div> : null}
            {record.review?.strengths.length ? <section className="mt-8"><h2 className="font-display text-2xl font-semibold">Puncte forte</h2><ul className="mt-3 list-disc space-y-2 ps-5">{record.review.strengths.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
            {record.review?.caveats.length ? <section className="mt-8"><h2 className="font-display text-2xl font-semibold">De știut înainte</h2><ul className="mt-3 list-disc space-y-2 ps-5">{record.review.caveats.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
          </div>
          <aside className="space-y-5"><div className="aspect-[2/3] rounded-2xl border border-border bg-paper p-5"><p className="text-sm font-bold">Copertă selectată</p><p className="mt-2 break-words text-xs leading-5 text-muted">{record.cover?.altText ?? "Nicio copertă selectată"}</p></div><PublishingChecklist items={record.gate} /></aside>
        </article>
      </div>
    </main>
  );
}
