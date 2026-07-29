import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader, EmptyState, StatusBadge } from "@/components/admin/editorial-ui";
import {
  getLaunchReadinessReport,
  readinessIssueKinds,
  readinessIssueLabels,
  type ReadinessIssueKind,
} from "@/db/queries/admin-readiness";
import { formatEditorialDate } from "@/domain/editorial/bucharest-date";
import { requireSectionAccess } from "@/lib/auth/principal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Readiness editorial" };

type PageProps = { searchParams: Promise<{ issue?: string }> };

function isIssue(value: string | undefined): value is ReadinessIssueKind {
  return readinessIssueKinds.includes(value as ReadinessIssueKind);
}

export default async function ReadinessPage({ searchParams }: PageProps) {
  await requireSectionAccess("readiness");
  const { issue } = await searchParams;
  const selectedIssue = isIssue(issue) ? issue : "all";
  const report = await getLaunchReadinessReport();
  const selectedIsBookIssue = selectedIssue !== "all"
    && selectedIssue !== "daily_calendar_gap"
    && selectedIssue !== "seo_hub_below_gate";
  const visibleBooks = selectedIssue === "all"
    ? report.books.filter((book) => book.issues.length)
    : selectedIsBookIssue
      ? report.books.filter((book) => book.issues.includes(selectedIssue))
      : [];
  const showBooks = selectedIssue === "all" || selectedIsBookIssue;
  const showCalendar = selectedIssue === "all" || selectedIssue === "daily_calendar_gap";
  const showSeo = selectedIssue === "all" || selectedIssue === "seo_hub_below_gate";
  const targets = [
    { label: "Pagini de carte solide", value: report.targets.strongBooks, target: 100, note: `${report.targets.publishedBooks} cărți publicate` },
    { label: "Autori publicați", value: report.targets.publishedAuthors, target: 20 },
    { label: "Hub-uri/liste eligibile", value: report.targets.readySeoHubs, target: 20 },
    { label: "Pagini next-read eligibile", value: report.targets.readyNextReadPages, target: 10 },
    { label: "Zile pregătite înainte", value: report.targets.scheduledDailyFeatures, target: report.calendar.days },
    { label: "Pagini de încredere", value: report.targets.trustPagesImplemented, target: 7, note: "Textul juridic final rămâne de validat" },
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Lansare fără conținut subțire"
        title="Readiness editorial"
        description="Raport operațional calculat din conținutul real. Țintele sunt repere de lansare, nu motive pentru a fabrica texte, relații sau oferte."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Ținte de conținut">
        {targets.map((target) => (
          <article key={target.label} className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{target.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {target.value.toLocaleString("ro-RO")} <span className="text-base text-muted">/ {target.target}</span>
            </p>
            {target.note ? <p className="mt-2 text-xs leading-5 text-muted">{target.note}</p> : null}
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Filtre operaționale</h2>
            <p className="mt-1 text-sm text-muted">O ofertă este considerată stale după {report.staleOfferDays} de zile fără verificare.</p>
          </div>
          <form className="flex flex-col gap-2 sm:flex-row" method="get">
            <label className="sr-only" htmlFor="issue">Problemă</label>
            <select id="issue" name="issue" defaultValue={selectedIssue} className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold">
              <option value="all">Toate problemele</option>
              {readinessIssueKinds.map((kind) => (
                <option key={kind} value={kind}>{readinessIssueLabels[kind]}</option>
              ))}
            </select>
            <button className="min-h-11 rounded-full bg-brand px-5 text-sm font-semibold text-white" type="submit">Aplică filtrul</button>
          </form>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {readinessIssueKinds.map((kind) => (
            <Link key={kind} href={`/admin/readiness?issue=${kind}`} className="rounded-full border border-border bg-paper px-3 py-1.5 text-xs font-semibold text-foreground hover:border-brand">
              {readinessIssueLabels[kind]} · {report.issueCounts[kind]}
            </Link>
          ))}
        </div>
      </section>

      {showBooks ? (
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Pagini de carte</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">De revizuit ({visibleBooks.length})</h2>
          </div>
          {visibleBooks.length ? (
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Carte</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Probleme</th><th className="px-5 py-4">Actualizare</th><th className="px-5 py-4"><span className="sr-only">Acțiuni</span></th></tr></thead>
                <tbody className="divide-y divide-border">
                  {visibleBooks.map((book) => (
                    <tr key={book.id} className="align-top">
                      <td className="px-5 py-4"><Link href={`/admin/books/${book.id}`} className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand">{book.title}</Link><span className="mt-1 block text-xs text-muted">{book.author}</span></td>
                      <td className="px-5 py-4"><StatusBadge status={book.status} /></td>
                      <td className="max-w-xl px-5 py-4"><ul className="flex flex-wrap gap-2">{book.issues.map((kind) => <li key={kind} className="rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-muted">{readinessIssueLabels[kind]}</li>)}</ul></td>
                      <td className="px-5 py-4 text-muted">{new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium" }).format(book.updatedAt)}</td>
                      <td className="px-5 py-4"><div className="flex gap-3"><Link href={`/admin/books/${book.id}`} className="font-semibold text-brand underline underline-offset-4">Editează</Link><Link href={`/admin/books/${book.id}/offers`} className="font-semibold text-brand underline underline-offset-4">Oferte</Link></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState>Nu există cărți pentru filtrul selectat.</EmptyState>}
        </section>
      ) : null}

      {showCalendar ? (
        <section className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Următoarele {report.calendar.days} de zile</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Goluri în calendar ({report.calendar.gaps.length})</h2>
          {report.calendar.gaps.length ? (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {report.calendar.gaps.map((gap) => (
                <li key={gap.date} className="rounded-xl bg-paper p-4">
                  <span className="block font-semibold">{formatEditorialDate(gap.date)}</span>
                  <span className="mt-1 block text-xs text-muted">{gap.existingStatus === "draft" ? "Există doar o ciornă" : "Nicio selecție programată"}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-5 text-sm font-semibold text-brand">Calendarul este acoperit integral în fereastra curentă.</p>}
          <Link href="/admin/daily-features" className="mt-5 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold hover:border-brand">Deschide calendarul</Link>
        </section>
      ) : null}

      {showSeo ? (
        <section className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Indexare cerută</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Hub-uri sub quality gate ({report.seo.belowGate.length})</h2>
          {report.seo.belowGate.length ? (
            <ul className="mt-5 divide-y divide-border">
              {report.seo.belowGate.map((hub) => (
                <li key={`${hub.kind}-${hub.id}`} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between">
                  <div><Link href={hub.adminHref} className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand">{hub.name}</Link><p className="mt-1 text-xs text-muted">{hub.kind} · {hub.status} · {hub.bookCount} selecții</p><ul className="mt-2 list-disc ps-5 text-xs leading-5 text-muted">{hub.missing.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <Link href={hub.adminHref} className="shrink-0 text-sm font-semibold text-brand underline underline-offset-4">Corectează</Link>
                </li>
              ))}
            </ul>
          ) : <p className="mt-5 text-sm font-semibold text-brand">Toate hub-urile care cer indexare trec quality gate-ul curent.</p>}
        </section>
      ) : null}

      <p className="mt-6 text-xs leading-5 text-muted">Raport generat la {new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" }).format(report.generatedAt)}. Nu completează automat conținut și nu activează indexarea.</p>
    </div>
  );
}
