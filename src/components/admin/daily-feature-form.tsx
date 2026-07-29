"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";

import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { SubmitButton } from "./submit-button";

type Values = { featureDate?: string; bookId?: string; editorId?: string; headline?: string | null; whyToday?: string | null; audienceNote?: string | null; caveat?: string | null; status?: string };
type Options = { books: Array<{ id: string; title: string; status: string }>; editors: Array<{ id: string; displayName: string }> };

export function DailyFeatureForm({ action, values = {}, options, editing = false }: { action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState>; values?: Values; options: Options; editing?: boolean }) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="grid gap-6">
      {state.status === "error" ? <div role="alert" className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{state.message}</div> : null}
      <FormSection title="Programare" description="Data este o zi editorială în fusul Europe/Bucharest. Pentru fiecare dată poate exista o singură selecție.">
        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClass}>Data *<input name="featureDate" type="date" required defaultValue={values.featureDate ?? ""} className={fieldClass} /><FieldError errors={errors.featureDate} /></label>
          <label className={labelClass}>Stare<select name="status" defaultValue={values.status ?? "scheduled"} className={fieldClass}><option value="draft">Ciornă</option><option value="scheduled">Programată</option><option value="published">Publicată</option><option value="archived">Arhivată</option></select></label>
          <label className={labelClass}>Carte *<select name="bookId" required defaultValue={values.bookId ?? ""} className={fieldClass}><option value="">Alege cartea</option>{options.books.map((book) => <option key={book.id} value={book.id}>{book.title} ({book.status})</option>)}</select><FieldError errors={errors.bookId} /></label>
          <label className={labelClass}>Editor<select name="editorId" defaultValue={values.editorId ?? ""} className={fieldClass}><option value="">Editorul conectat</option>{options.editors.map((editor) => <option key={editor.id} value={editor.id}>{editor.displayName}</option>)}</select></label>
        </div>
      </FormSection>
      <FormSection title="Context editorial" description="Selecția este explicită și calendaristică; nu există mod aleatoriu.">
        <div className="grid gap-5">
          <label className={labelClass}>Titlu editorial<textarea name="headline" rows={2} defaultValue={values.headline ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>De ce astăzi<textarea name="whyToday" rows={6} defaultValue={values.whyToday ?? ""} className={fieldClass} /></label>
          <div className="grid gap-5 md:grid-cols-2"><label className={labelClass}>Pentru cine este potrivită<textarea name="audienceNote" rows={5} defaultValue={values.audienceNote ?? ""} className={fieldClass} /></label><label className={labelClass}>Rezervă editorială<textarea name="caveat" rows={5} defaultValue={values.caveat ?? ""} className={fieldClass} /></label></div>
        </div>
      </FormSection>
      <div className="flex flex-wrap items-center gap-3"><SubmitButton>{editing ? "Salvează selecția" : "Programează selecția"}</SubmitButton><Link href="/admin/daily-features" className="text-sm font-semibold text-muted hover:text-foreground">Renunță</Link></div>
    </form>
  );
}
