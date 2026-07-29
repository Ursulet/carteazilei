import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/admin/editorial-ui";
import { getAdminDashboardSummary } from "@/db/queries/admin-dashboard";
import { canAccessSection } from "@/lib/auth/access";
import { requireSectionAccess } from "@/lib/auth/principal";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const principal = await requireSectionAccess("dashboard");
  const summary = await getAdminDashboardSummary();
  const cards = [
    { label: "Cărți în catalog", value: summary.books.total, detail: `${summary.books.published} publicate`, href: "/admin/books", section: "books" as const },
    { label: "De completat", value: summary.books.draft, detail: "ciorne și cărți în revizie", href: "/admin/readiness", section: "readiness" as const },
    { label: "Autori", value: summary.authors, detail: "în catalog", href: "/admin/authors", section: "authors" as const },
    { label: "Imagini", value: summary.media, detail: "în biblioteca media", href: "/admin/media", section: "media" as const },
    { label: "Parteneri activi", value: summary.partners, detail: `${summary.offers} oferte active`, href: "/admin/retailers", section: "retailers" as const },
    { label: "Selecții calendar", value: summary.dailyFeatures, detail: "programate sau publicate", href: "/admin/daily-features", section: "daily-features" as const },
  ].filter((card) => canAccessSection(principal.roles, card.section));

  const quickActions = [
    { label: "Adaugă o carte", href: "/admin/books/new", section: "books" as const },
    { label: "Adaugă un autor", href: "/admin/authors/new", section: "authors" as const },
    { label: "Încarcă o imagine", href: "/admin/media", section: "media" as const },
    { label: "Planifică Cartea Zilei", href: "/admin/daily-features/new", section: "daily-features" as const },
  ].filter((action) => canAccessSection(principal.roles, action.section));

  return (
    <div>
      <header className="border-b border-border pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent-dark">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Bun venit, {principal.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">Aici vezi situația catalogului și ajungi rapid la operațiunile folosite cel mai des.</p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Situația catalogului">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="group rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:border-brand">
            <div className="flex items-start justify-between gap-4"><p className="text-sm font-semibold text-muted">{card.label}</p><ArrowUpRight aria-hidden="true" className="size-4 text-muted transition group-hover:text-brand" /></div>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{card.value.toLocaleString("ro-RO")}</p>
            <p className="mt-1 text-xs text-muted">{card.detail}</p>
          </Link>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Catalog</p><h2 className="mt-2 font-display text-2xl font-semibold">Modificate recent</h2></div>{canAccessSection(principal.roles, "books") ? <Link href="/admin/books" className="text-sm font-semibold text-brand underline underline-offset-4">Toate cărțile</Link> : null}</div>
          {summary.recentBooks.length ? (
            <ul className="mt-5 divide-y divide-border">
              {summary.recentBooks.map((book) => <li key={book.id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div><Link href={`/admin/books/${book.id}`} className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand">{book.title}</Link><p className="mt-1 text-xs text-muted">{book.author} · {new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium" }).format(book.updatedAt)}</p></div><StatusBadge status={book.status} /></li>)}
            </ul>
          ) : <p className="mt-5 text-sm text-muted">Catalogul este gol. Începe prin a adăuga un autor și prima carte.</p>}
        </section>

        <aside className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Acțiuni rapide</p>
          <div className="mt-4 grid gap-3">
            {quickActions.map((action) => <Link key={action.href} href={action.href} className="flex min-h-11 items-center justify-between rounded-xl border border-border bg-paper px-4 text-sm font-semibold transition hover:border-brand">{action.label}<ArrowUpRight aria-hidden="true" className="size-4 text-muted" /></Link>)}
          </div>
        </aside>
      </div>
    </div>
  );
}
