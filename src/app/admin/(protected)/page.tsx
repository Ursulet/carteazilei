import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/admin/editorial-ui";
import { getAdminDashboardSummary } from "@/db/queries/admin-dashboard";
import { adminNavigationSections, canAccessSection } from "@/lib/auth/access";
import { hasPermission } from "@/lib/auth/permissions";
import { requireSectionAccess } from "@/lib/auth/principal";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const principal = await requireSectionAccess("dashboard");
  const summary = await getAdminDashboardSummary();
  const canSeeBooks = canAccessSection(principal.permissions, "books", principal.isSuperAdmin);
  const canSeeRecommendations = canAccessSection(principal.permissions, "recommendations", principal.isSuperAdmin);
  const canSeeRetailers = canAccessSection(principal.permissions, "retailers", principal.isSuperAdmin);
  const cards = [
    { label: "Cărți în catalog", value: summary.books.total, detail: `${summary.books.published} publicate`, href: "/admin/books", visible: canSeeBooks },
    { label: "De completat", value: summary.books.draft, detail: "ciorne și cărți în revizie", href: "/admin/readiness", visible: canAccessSection(principal.permissions, "readiness", principal.isSuperAdmin) },
    { label: "Autori", value: summary.authors, detail: "în catalog", href: "/admin/authors", visible: canAccessSection(principal.permissions, "authors", principal.isSuperAdmin) },
    { label: "Imagini", value: summary.media, detail: "în biblioteca media", href: "/admin/media", visible: canAccessSection(principal.permissions, "media", principal.isSuperAdmin) },
    { label: "Parteneri activi", value: summary.partners, detail: `${summary.offers} oferte active`, href: "/admin/retailers", visible: canSeeRetailers },
    { label: "Clickuri comerciale", value: summary.recentClicks, detail: "în ultimele 7 zile", href: canSeeRecommendations ? "/admin/recommendations" : "/admin/retailers", visible: hasPermission(principal.permissions, "commercial.analytics", principal.isSuperAdmin) && (canSeeRecommendations || canSeeRetailers) },
    { label: "Utilizatori activi", value: summary.activeUsers, detail: `${summary.invitedUsers} invitații în așteptare`, href: "/admin/editors", visible: canAccessSection(principal.permissions, "editors", principal.isSuperAdmin) },
    { label: "Mesaje necitite", value: summary.unreadMessages, detail: "în inbox-ul de contact", href: "/admin/messages?status=new", visible: canAccessSection(principal.permissions, "messages", principal.isSuperAdmin) },
    { label: "Recomandări generate", value: summary.recentRecommendations, detail: "în ultimele 7 zile", href: "/admin/recommendations", visible: canSeeRecommendations },
    { label: "Selecții calendar", value: summary.dailyFeatures, detail: "programate sau publicate", href: "/admin/daily-features", visible: canAccessSection(principal.permissions, "daily-features", principal.isSuperAdmin) },
  ].filter((card) => card.visible);

  const quickActions = [
    { label: "Adaugă o carte", href: "/admin/books/new", permission: "books.create" as const },
    { label: "Adaugă un autor", href: "/admin/authors/new", permission: "authors.manage" as const },
    { label: "Încarcă o imagine", href: "/admin/media", permission: "media.manage" as const },
    { label: "Planifică Cartea Zilei", href: "/admin/daily-features/new", permission: "daily_features.manage" as const },
    { label: "Adaugă un partener", href: "/admin/retailers/new", permission: "partners.manage" as const },
    { label: "Adaugă un utilizator", href: "/admin/editors/new", permission: "users.create" as const },
    { label: "Deschide mesajele", href: "/admin/messages?status=new", permission: "contact_messages.view" as const },
  ].filter((action) => hasPermission(principal.permissions, action.permission, principal.isSuperAdmin));

  const workspaceAreas = adminNavigationSections.filter((section) =>
    section.id !== "dashboard" && canAccessSection(principal.permissions, section.id, principal.isSuperAdmin),
  ).slice(0, 8);
  const roleLabel = principal.roleNames.join(", ") || "Fără rol";

  return (
    <div>
      <header className="border-b border-border pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent-dark">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Bun venit, {principal.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">Panoul este adaptat rolului și permisiunilor tale. Vezi numai indicatorii și operațiunile la care ai acces.</p>
        <p className="mt-3 inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-brand">{roleLabel}</p>
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

      {summary.alerts.filter((alert) => alert && canAccessSection(principal.permissions, alert.section, principal.isSuperAdmin)).length ? <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-amber-900">Necesită atenție</p><div className="mt-3 grid gap-2">{summary.alerts.filter((alert) => alert && canAccessSection(principal.permissions, alert.section, principal.isSuperAdmin)).map((alert) => alert ? <Link key={alert.label} href={alert.href} className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 text-sm font-semibold text-amber-950 hover:bg-white"><span>{alert.label}</span><ArrowUpRight className="size-4" /></Link> : null)}</div></section> : null}

      <div className={`mt-8 grid gap-6 ${quickActions.length ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}>
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          {canSeeBooks ? (
            <>
              <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Catalog</p><h2 className="mt-2 font-display text-2xl font-semibold">Modificate recent</h2></div><Link href="/admin/books" className="text-sm font-semibold text-brand underline underline-offset-4">Toate cărțile</Link></div>
              {summary.recentBooks.length ? (
                <ul className="mt-5 divide-y divide-border">
                  {summary.recentBooks.map((book) => <li key={book.id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div><Link href={`/admin/books/${book.id}`} className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand">{book.title}</Link><p className="mt-1 text-xs text-muted">{book.author} · {new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium" }).format(book.updatedAt)}</p></div><StatusBadge status={book.status} /></li>)}
                </ul>
              ) : <p className="mt-5 text-sm text-muted">Catalogul este gol. Începe prin a adăuga un autor și prima carte.</p>}
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Accesul tău</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Zona ta de lucru</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Destinațiile sunt construite din permisiunile rolurilor tale.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {workspaceAreas.map((section) => <Link key={section.id} href={section.href} className="rounded-xl border border-border bg-paper p-4 transition hover:border-brand"><span className="font-semibold">{section.label}</span><span className="mt-1 block text-xs leading-5 text-muted">{section.description}</span></Link>)}
              </div>
            </>
          )}
        </section>

        {quickActions.length ? <aside className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Acțiuni rapide</p>
          <div className="mt-4 grid gap-3">
            {quickActions.map((action) => <Link key={action.href} href={action.href} className="flex min-h-11 items-center justify-between rounded-xl border border-border bg-paper px-4 text-sm font-semibold transition hover:border-brand">{action.label}<ArrowUpRight aria-hidden="true" className="size-4 text-muted" /></Link>)}
          </div>
        </aside> : null}
      </div>
      {summary.recentAudit.length && canAccessSection(principal.permissions, "audit", principal.isSuperAdmin) ? <section className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Sistem</p><h2 className="mt-2 font-display text-2xl font-semibold">Acțiuni administrative recente</h2></div><Link href="/admin/audit" className="text-sm font-semibold text-brand underline">Jurnal complet</Link></div><ul className="mt-5 divide-y divide-border">{summary.recentAudit.map((entry) => <li key={entry.id} className="flex justify-between gap-4 py-3 text-sm"><span><strong>{entry.actorName ?? "Sistem"}</strong> · {entry.action} · {entry.entityType}</span><time className="shrink-0 text-xs text-muted">{new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" }).format(entry.createdAt)}</time></li>)}</ul></section> : null}
    </div>
  );
}
