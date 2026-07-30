import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import { RecommendationSettingsForm } from "@/components/admin/recommendation-settings-form";
import { getRecommendationAnalyticsOverview } from "@/db/queries/admin-analytics";
import { getRecommendationCandidates } from "@/db/queries/recommendation-candidates";
import { getRecommendationConfiguration } from "@/domain/recommendation/configuration-service";
import { canMutateSection } from "@/lib/auth/access";
import { requireSectionAccess } from "@/lib/auth/principal";

import { updateRecommendationConfigurationAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recomandări și analytics" };

const needLabels: Record<string, string> = {
  captivating: "Să mă captiveze",
  relaxing: "Să mă relaxeze",
  thought_provoking: "Să mă facă să gândesc",
  learning: "Să învăț ceva",
  emotional: "Să mă emoționeze",
  out_of_routine: "Să mă scoată din rutină",
};

const paceLabels: Record<string, string> = {
  slow_atmospheric: "Lent / atmosferic",
  balanced: "Echilibrat",
  fast: "Alert",
  any: "Orice ritm",
};

const lengthLabels: Record<string, string> = {
  under_200: "Sub 200 pagini",
  "200_350": "200–350 pagini",
  "350_500": "350–500 pagini",
  over_500: "Peste 500 pagini",
  any: "Orice lungime",
};

function percentage(value: number | null) {
  return value === null
    ? "—"
    : new Intl.NumberFormat("ro-RO", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

export default async function RecommendationAnalyticsPage() {
  const principal = await requireSectionAccess("recommendations");
  const [analytics, configuration, candidates] = await Promise.all([
    getRecommendationAnalyticsOverview(),
    getRecommendationConfiguration(),
    getRecommendationCandidates(null),
  ]);

  const metrics = [
    {
      label: "Quiz începute",
      value: analytics.quiz.starts.toLocaleString("ro-RO"),
      note: `${analytics.quiz.completions.toLocaleString("ro-RO")} finalizate`,
    },
    {
      label: "Rată finalizare",
      value: percentage(analytics.quiz.completionRate),
      note: "sesiuni finalizate / sesiuni pornite în fereastră",
    },
    {
      label: "Cereri alternative",
      value: percentage(analytics.alternatives.rate),
      note: `${analytics.alternatives.requested.toLocaleString("ro-RO")} sesiuni cu alternativă / ${analytics.alternatives.primaryResultsShown.toLocaleString("ro-RO")} sesiuni cu rezultat principal`,
    },
    {
      label: "CTR oferte",
      value: percentage(analytics.commercial.ctr),
      note: `${analytics.commercial.clicks.toLocaleString("ro-RO")} clickuri / ${analytics.commercial.impressions.toLocaleString("ro-RO")} afișări`,
    },
    {
      label: "Feedback pozitiv",
      value: percentage(analytics.feedback.positiveRate),
      note: `${analytics.feedback.positive.toLocaleString("ro-RO")} pozitiv · ${analytics.feedback.negative.toLocaleString("ro-RO")} negativ`,
    },
    {
      label: "Intrări organice",
      value: analytics.acquisition.organicLandings.toLocaleString("ro-RO"),
      note: `${percentage(analytics.acquisition.organicRate)} din ${analytics.acquisition.landings.toLocaleString("ro-RO")} intrări first-party`,
    },
    {
      label: "Eșantion indexare",
      value: analytics.indexation.indexed === null
        ? "—"
        : `${analytics.indexation.indexed}/${analytics.indexation.sampleSize}`,
      note: analytics.indexation.status === "not_connected"
        ? "Search Console nu este conectat; nu inventăm un status."
        : "URL-uri indexate din eșantionul verificat",
    },
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Motor de recomandare"
        title="Recomandări"
        description="Configurează ponderile folosite la potrivire și urmărește rezultatele generate."
      />

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Configurație activă</p><h2 className="mt-2 font-display text-2xl font-semibold">Scor și ponderi</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Valorile sunt normalizate automat. O modificare afectează numai recomandările generate după salvare.</p></div><div className="rounded-xl bg-paper px-4 py-3 text-sm"><strong>{candidates.length}</strong> {candidates.length === 1 ? "carte eligibilă" : "cărți eligibile"}<span className="mx-2 text-border">·</span>revizia <strong>{configuration.revision}</strong></div></div>
        {canMutateSection(principal.permissions, "recommendations", principal.isSuperAdmin) ? <RecommendationSettingsForm action={updateRecommendationConfigurationAction} values={configuration} /> : <p className="mt-5 rounded-xl bg-paper px-4 py-3 text-sm text-muted">Rolul tău poate consulta configurația și rapoartele, dar nu le poate modifica.</p>}
      </section>

      <div className="mt-10 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Ultimele {analytics.windowDays} de zile</p><h2 className="mt-2 font-display text-3xl font-semibold">Performanță și feedback</h2></div><Link href="/admin/books" className="text-sm font-semibold text-brand underline underline-offset-4">Completează profilurile cărților</Link></div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7" aria-label="Indicatori principali">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{metric.value}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{metric.note}</p>
          </article>
        ))}
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <section className="rounded-2xl border border-border bg-surface p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Distribuția rezultatelor generate</p>
            <h2 className="mt-2 text-xl font-semibold">Cărți și poziții</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Distribuția descrie ieșirea motorului, nu un clasament editorial public.</p>
          </div>
          {analytics.distribution.length ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <tr><th className="pb-3 font-semibold">Carte</th><th className="pb-3 font-semibold">Poziție</th><th className="pb-3 text-right font-semibold">Rezultate</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.distribution.map((row) => (
                    <tr key={`${row.bookId}-${row.rank}`}>
                      <td className="py-3 pe-4 font-semibold">{row.title}</td>
                      <td className="py-3 pe-4">#{row.rank}</td>
                      <td className="py-3 text-right tabular-nums">{row.total.toLocaleString("ro-RO")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="mt-6"><EmptyState><strong className="block text-foreground">Nu există încă rezultate în această fereastră.</strong><span className="mt-2 block">Distribuția va apărea după finalizarea și evaluarea primelor sesiuni.</span></EmptyState></div>}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Intenții declarate</p>
          <h2 className="mt-2 text-xl font-semibold">Nevoi de lectură</h2>
          {analytics.needs.length ? (
            <ol className="mt-6 divide-y divide-border">
              {analytics.needs.map((item) => (
                <li key={item.need} className="flex items-center justify-between gap-4 py-3 first:pt-0">
                  <span className="text-sm font-semibold">{needLabels[item.need] ?? item.need}</span>
                  <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold tabular-nums">{item.total.toLocaleString("ro-RO")}</span>
                </li>
              ))}
            </ol>
          ) : <p className="mt-6 text-sm leading-6 text-muted">Nu există încă răspunsuri agregate.</p>}
        </section>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Calitatea rezultatului</p>
          <h2 className="mt-2 text-xl font-semibold">Top situații zero / încredere scăzută</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Sunt incluse numai sesiuni pentru care generarea rezultatului a fost cerută. Pragul operațional de încredere scăzută este scorul principal sub 50.</p>
          {analytics.confidenceSituations.length ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[38rem] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted"><tr><th className="pb-3 font-semibold">Situație</th><th className="pb-3 font-semibold">Nevoie</th><th className="pb-3 font-semibold">Ritm / lungime</th><th className="pb-3 text-right font-semibold">Sesiuni</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {analytics.confidenceSituations.map((item) => (
                    <tr key={`${item.issueType}-${item.need}-${item.pace}-${item.length}`}>
                      <td className="py-3 pe-4 font-semibold">{item.issueType === "zero_result" ? "Fără rezultat" : "Încredere scăzută"}</td>
                      <td className="py-3 pe-4">{needLabels[item.need] ?? item.need}</td>
                      <td className="py-3 pe-4 text-muted">{paceLabels[item.pace] ?? item.pace} · {lengthLabels[item.length] ?? item.length}</td>
                      <td className="py-3 text-right tabular-nums">{item.total.toLocaleString("ro-RO")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="mt-6"><EmptyState>Nu există încă situații zero sau sub prag în fereastra curentă.</EmptyState></div>}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">Engagement first-party</p>
          <h2 className="mt-2 text-xl font-semibold">Pagini cu cele mai multe vizualizări urmărite</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Indicatorul nu estimează timpul de lectură și nu este un semnal pentru algoritmul de recomandare.</p>
          {analytics.topPages.length ? (
            <ol className="mt-6 divide-y divide-border">
              {analytics.topPages.map((page) => (
                <li key={page.path} className="flex items-center justify-between gap-4 py-3 first:pt-0">
                  <Link href={page.path} className="min-w-0 truncate text-sm font-semibold underline decoration-border underline-offset-4 hover:decoration-brand">{page.path}</Link>
                  <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold tabular-nums">{page.views.toLocaleString("ro-RO")}</span>
                </li>
              ))}
            </ol>
          ) : <p className="mt-6 text-sm leading-6 text-muted">Trackingul de pagină nu are încă evenimente în această fereastră.</p>}
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-paper p-5 text-sm leading-6 text-muted">
        <strong className="text-foreground">Semnale de progres:</strong> {analytics.feedback.started.toLocaleString("ro-RO")} cititori au marcat cartea ca începută și {analytics.feedback.finished.toLocaleString("ro-RO")} ca terminată în fereastra curentă. Aceste acțiuni sunt feedback, nu dovezi independente de lectură.
      </section>
    </div>
  );
}
