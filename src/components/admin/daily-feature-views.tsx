"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ConfirmDeleteForm } from "./confirm-delete-form";
import { StatusBadge } from "./editorial-ui";

type FeatureRow = { id: string; featureDate: string; headline: string | null; status: string; bookTitle: string; editorName: string; updatedAt: string };

function monthLabel(key: string) {
  return new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric", timeZone: "Europe/Bucharest" }).format(new Date(`${key}-15T12:00:00+03:00`));
}

export function DailyFeatureViews({ rows, deleteAction }: { rows: FeatureRow[]; deleteAction: (id: string, formData: FormData) => void | Promise<void> }) {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const months = useMemo(() => {
    const grouped = new Map<string, FeatureRow[]>();
    for (const row of rows) { const key = row.featureDate.slice(0, 7); grouped.set(key, [...(grouped.get(key) ?? []), row]); }
    return [...grouped.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [rows]);
  return (
    <div>
      <div className="mb-5 inline-flex rounded-full border border-border bg-surface p-1" aria-label="Mod afișare"><button type="button" onClick={() => setView("calendar")} aria-pressed={view === "calendar"} className={`rounded-full px-4 py-2 text-sm font-bold ${view === "calendar" ? "bg-brand text-white" : "text-muted"}`}>Calendar</button><button type="button" onClick={() => setView("list")} aria-pressed={view === "list"} className={`rounded-full px-4 py-2 text-sm font-bold ${view === "list" ? "bg-brand text-white" : "text-muted"}`}>Listă</button></div>
      {view === "calendar" ? <div className="grid items-start gap-5 lg:grid-cols-2 2xl:grid-cols-3">{months.map(([month, entries]) => {
        const [year, monthNumber] = month.split("-").map(Number);
        const offset = (new Date(Date.UTC(year!, monthNumber! - 1, 1)).getUTCDay() + 6) % 7;
        const daysInMonth = new Date(Date.UTC(year!, monthNumber!, 0)).getUTCDate();
        const byDay = new Map(entries.map((entry) => [Number(entry.featureDate.slice(8, 10)), entry]));
        return <section key={month} className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-sm"><h2 className="font-display text-xl font-semibold capitalize">{monthLabel(month)}</h2><div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-bold uppercase text-muted">{["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"].map((day) => <span key={day}>{day}</span>)}</div><div className="mt-1.5 grid grid-cols-7 gap-1">{Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} className="h-14 sm:h-16" />)}{Array.from({ length: daysInMonth }, (_, index) => { const day = index + 1; const row = byDay.get(day); return row ? <Link key={day} href={`/admin/daily-features/${row.id}`} title={row.bookTitle} className="group relative h-14 min-w-0 overflow-hidden rounded-lg border border-brand/25 bg-accent-soft/55 p-1.5 transition hover:border-brand hover:bg-accent-soft sm:h-16"><span className="text-[0.68rem] font-bold text-accent-dark">{day}</span><span className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-brand sm:hidden" /><span className="mt-1 hidden line-clamp-2 text-[0.65rem] font-semibold leading-3 text-foreground sm:block">{row.bookTitle}</span></Link> : <span key={day} className="h-14 rounded-lg border border-border/35 p-1.5 text-[0.68rem] text-muted sm:h-16">{day}</span>; })}</div></section>;
      })}</div> : <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Data</th><th className="px-5 py-4">Carte</th><th className="px-5 py-4">Editor</th><th className="px-5 py-4">Stare</th><th className="px-5 py-4"><span className="sr-only">Acțiuni</span></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-border/70 last:border-0"><td className="px-5 py-4"><Link href={`/admin/daily-features/${row.id}`} className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand">{new Intl.DateTimeFormat("ro-RO", { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(new Date(`${row.featureDate}T12:00:00+03:00`))}</Link></td><td className="px-5 py-4"><strong>{row.bookTitle}</strong>{row.headline ? <span className="mt-1 block text-xs text-muted">{row.headline}</span> : null}</td><td className="px-5 py-4 text-muted">{row.editorName}</td><td className="px-5 py-4"><StatusBadge status={row.status} /></td><td className="px-5 py-4"><ConfirmDeleteForm action={deleteAction.bind(null, row.id)} /></td></tr>)}</tbody></table></div>}
    </div>
  );
}
