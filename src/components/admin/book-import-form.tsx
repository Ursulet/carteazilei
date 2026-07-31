"use client";

import { useActionState } from "react";

import type { BookImportActionState, BookImportReportItem } from "@/domain/editorial/book-import-types";
import { initialBookImportActionState } from "@/domain/editorial/book-import-types";

import { fieldClass, labelClass } from "./editorial-ui";
import { SubmitButton } from "./submit-button";

export function BookImportForm({ action }: { action: (state: BookImportActionState, formData: FormData) => Promise<BookImportActionState> }) {
  const [state, formAction] = useActionState(action, initialBookImportActionState);
  return (
    <div>
      <form action={formAction} className="grid gap-5">
        <label className={labelClass}>
          Fișier CSV *
          <input name="file" type="file" required accept=".csv,text/csv" className={`${fieldClass} file:me-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:font-semibold file:text-brand`} />
        </label>
        <p className="text-xs leading-5 text-muted">Maximum 200 de cărți și 2 MB per fișier. Importul creează numai ciorne; publicarea rămâne o acțiune separată.</p>
        <div><SubmitButton>Importă cărțile</SubmitButton></div>
      </form>

      {state.message ? <div role={state.status === "error" ? "alert" : "status"} className={`mt-6 rounded-xl border px-4 py-3 text-sm font-semibold ${state.status === "error" ? "border-danger/30 bg-red-50 text-danger" : "border-brand/20 bg-accent-soft text-brand"}`}>{state.message}</div> : null}
      <ImportResults title="Importate" items={state.imported} tone="success" />
      <ImportResults title="Omise" items={state.skipped} tone="neutral" />
      <ImportResults title="Erori" items={state.errors} tone="error" />
    </div>
  );
}

function ImportResults({ title, items, tone }: { title: string; items: BookImportReportItem[]; tone: "success" | "neutral" | "error" }) {
  if (!items.length) return null;
  const toneClass = tone === "error" ? "text-danger" : tone === "success" ? "text-brand" : "text-muted";
  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-border">
      <h3 className={`bg-paper px-4 py-3 text-sm font-bold ${toneClass}`}>{title} ({items.length})</h3>
      <div className="max-h-72 overflow-auto">
        <table className="w-full min-w-[650px] text-left text-xs">
          <thead className="border-y border-border bg-surface text-muted"><tr><th className="px-4 py-2">Rând</th><th className="px-4 py-2">Identificator</th><th className="px-4 py-2">Carte</th><th className="px-4 py-2">Rezultat</th></tr></thead>
          <tbody className="divide-y divide-border">{items.map((item) => <tr key={`${title}-${item.row}-${item.identifier}`}><td className="px-4 py-3">{item.row}</td><td className="px-4 py-3 font-mono">{item.identifier}</td><td className="px-4 py-3 font-semibold">{item.bookId ? <a className="text-brand underline underline-offset-2" href={`/admin/books/${item.bookId}`}>{item.title}</a> : item.title}</td><td className="px-4 py-3 text-muted">{item.message}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
