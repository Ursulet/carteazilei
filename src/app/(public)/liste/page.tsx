import type { Metadata } from "next";
import { ArrowRight, BookOpen, LibraryBig, Sparkles } from "lucide-react";
import Link from "next/link";

import { PublicEmptyState } from "@/components/editorial/public-empty-state";
import { PublicPageHeader } from "@/components/editorial/public-page-header";
import { listPublicEditorialLists } from "@/db/queries/public-seo-hubs";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPublicMetadata({ title: "Liste editoriale", description: "Selecții de cărți argumentate, construite în jurul unei intenții clare.", canonical: "/liste" });

export default async function ListsPage() {
  const lists = await listPublicEditorialLists();
  return (
    <div>
      <PublicPageHeader eyebrow="Selecții tematice" title="Liste pentru fiecare chef de lectură" description="Descoperă cărți grupate după teme, stări și momente de lectură." currentLabel="Liste" currentPath="/liste" />
      <section className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          {lists.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {lists.map((page) => (
                <Link key={page.list.id} href={page.href} className="group rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex size-10 items-center justify-center rounded-full bg-rust-soft text-rust-dark"><LibraryBig aria-hidden="true" className="size-5" /></span>
                    <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted"><BookOpen aria-hidden="true" className="size-4" />{page.selections.length} cărți</p>
                  </div>
                  <h2 className="mt-5 font-display text-3xl font-semibold">{page.list.title}</h2>
                  <p className="mt-4 line-clamp-4 leading-7 text-muted">{page.list.intro}</p>
                  <span className="mt-6 inline-flex items-center text-sm font-bold text-brand">Vezi selecția <ArrowRight aria-hidden="true" className="ms-2 size-4 transition-transform group-hover:translate-x-0.5" /></span>
                </Link>
              ))}
            </div>
          ) : (
            <PublicEmptyState title="Alege o carte potrivită pentru tine" description="Până publicăm primele colecții, poți porni de la recomandarea personalizată sau de la catalog.">
              <Link href="/recomanda-mi" className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover">Recomandă-mi o carte <Sparkles aria-hidden="true" className="ms-2 size-4" /></Link>
              <Link href="/carti" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Vezi cărțile <ArrowRight aria-hidden="true" className="ms-2 size-4" /></Link>
            </PublicEmptyState>
          )}
        </div>
      </section>
    </div>
  );
}
