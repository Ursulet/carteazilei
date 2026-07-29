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
      {view === "calendar" ? <div className="grid gap-6">{months.map(([month, entries]) => {
        const [year, monthNumber] = month.split("-").map(Number);
        const offset = (new Date(Date.UTC(year!, monthNumber! - 1, 1)).getUTCDay() + 6) % 7;
        const daysInMonth = new Date(Date.UTC(year!, monthNumber!, 0)).getUTCDate();
        const byDay = new Map(entries.map((entry) => [Number(entry.featureDate.slice(8, 10)), entry]));
        return <section key={month} className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><h2 className="font-display text-2xl font-semibold capitalize">{monthLabel(month)}</h2><div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-muted">{["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"].map((day) => <span key={day}>{day}</span>)}</div><div className="mt-2 grid grid-cols-7 gap-1">{Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} />)}{Array.from({ length: daysInMonth }, (_, index) => { const day = index + 1; const row = byDay.get(day); return row ? <Link key={day} href={`/admin/daily-features/${row.id}`} className="min-h-24 rounded-xl border border-border bg-paper p-2 transition hover:border-brand"><span className="text-xs font-bold text-accent-dark">{day}</span><span className="mt-2 line-clamp-3 block text-xs font-semibold leading-4">{row.bookTitle}</span></Link> : <span key={day} className="min-h-24 rounded-xl border border-border/40 p-2 text-xs text-muted">{day}</span>; })}</div></section>;
      })}</div> : <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Data</th><th className="px-5 py-4">Carte</th><th className="px-5 py-4">Editor</th><th className="px-5 py-4">Stare</th><th className="px-5 py-4"><span className="sr-only">Acțiuni</span></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-border/70 last:border-0"><td className="px-5 py-4"><Link href={`/admin/daily-features/${row.id}`} className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand">{new Intl.DateTimeFormat("ro-RO", { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(new Date(`${row.featureDate}T12:00:00+03:00`))}</Link></td><td className="px-5 py-4"><strong>{row.bookTitle}</strong>{row.headline ? <span className="mt-1 block text-xs text-muted">{row.headline}</span> : null}</td><td className="px-5 py-4 text-muted">{row.editorName}</td><td className="px-5 py-4"><StatusBadge status={row.status} /></td><td className="px-5 py-4"><ConfirmDeleteForm action={deleteAction.bind(null, row.id)} /></td></tr>)}</tbody></table></div>}
    </div>
  );
}
