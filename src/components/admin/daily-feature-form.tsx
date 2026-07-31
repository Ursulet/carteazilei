"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";

import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { SubmitButton } from "./submit-button";

type Values = { featureDate?: string; bookId?: string; editorId?: string; primaryOfferId?: string | null; headline?: string | null; whyToday?: string | null; audienceNote?: string | null; fitPoints?: string[]; caveat?: string | null; status?: string };
type Options = {
  books: Array<{ id: string; title: string; status: string }>;
  editors: Array<{ id: string; displayName: string }>;
  offers: Array<{ id: string; bookId: string; bookTitle: string; partnerName: string; price: string | null; currency: string | null; isPrimary: boolean }>;
};

export function DailyFeatureForm({ action, values = {}, options, editing = false }: { action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState>; values?: Values; options: Options; editing?: boolean }) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="grid gap-6">
      {state.status === "error" ? <div role="alert" className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{state.message}</div> : null}
      <FormSection title="Programare" description="Data este interpretată în fusul Europe/Bucharest. O selecție programată devine vizibilă automat în ziua aleasă; nu este necesar un cron separat.">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[14rem_22rem_minmax(18rem,1fr)_minmax(14rem,0.75fr)]">
          <label className={labelClass}>Data *<input name="featureDate" type="date" required defaultValue={values.featureDate ?? ""} className={fieldClass} /><FieldError errors={errors.featureDate} /></label>
          <label className={labelClass}>Stare<select name="status" defaultValue={values.status ?? "scheduled"} className={fieldClass}><option value="draft">Ciornă</option><option value="scheduled">Programată — apare automat la data aleasă</option><option value="published">Publicată</option><option value="archived">Arhivată</option></select></label>
          <label className={labelClass}>Carte *<select name="bookId" required defaultValue={values.bookId ?? ""} className={fieldClass}><option value="">Alege cartea</option>{options.books.map((book) => <option key={book.id} value={book.id}>{book.title} ({book.status})</option>)}</select><FieldError errors={errors.bookId} /></label>
          <label className={labelClass}>Editor<select name="editorId" defaultValue={values.editorId ?? ""} className={fieldClass}><option value="">Editorul conectat</option>{options.editors.map((editor) => <option key={editor.id} value={editor.id}>{editor.displayName}</option>)}</select></label>
        </div>
      </FormSection>
      <FormSection title="Context editorial" description="Selecția este explicită și calendaristică; nu există mod aleatoriu.">
        <div className="grid gap-5">
          <label className={labelClass}>Titlu editorial<textarea name="headline" rows={2} defaultValue={values.headline ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>De ce astăzi<textarea name="whyToday" rows={6} defaultValue={values.whyToday ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Trei motive de potrivire — unul pe linie<textarea name="fitPoints" rows={5} defaultValue={values.fitPoints?.join("\n") ?? ""} className={fieldClass} /><span className="mt-1.5 block text-xs font-normal text-muted">Sunt necesare minimum trei pentru publicare.</span></label>
          <div className="grid gap-5 md:grid-cols-2"><label className={labelClass}>Pentru cine este potrivită<textarea name="audienceNote" rows={5} defaultValue={values.audienceNote ?? ""} className={fieldClass} /></label><label className={labelClass}>Rezervă editorială<textarea name="caveat" rows={5} defaultValue={values.caveat ?? ""} className={fieldClass} /></label></div>
        </div>
      </FormSection>
      <FormSection title="Oferta afișată cu selecția" description="Oferta este aleasă numai după carte și nu poate influența selecția editorială. Dacă nu alegi una, aplicația folosește oferta principală a cărții.">
        <label className={labelClass}>Oferta comercială principală
          <select name="primaryOfferId" defaultValue={values.primaryOfferId ?? ""} className={fieldClass}>
            <option value="">Automat — oferta principală a cărții</option>
            {options.offers.map((offer) => <option key={offer.id} value={offer.id}>{offer.bookTitle} — {offer.partnerName}{offer.price && offer.currency ? ` — ${offer.price} ${offer.currency}` : ""}{offer.isPrimary ? " · principală" : ""}</option>)}
          </select>
          <FieldError errors={errors.primaryOfferId} />
        </label>
      </FormSection>
      <div className="flex flex-wrap items-center gap-3"><SubmitButton>{editing ? "Salvează selecția" : "Programează selecția"}</SubmitButton><Link href="/admin/daily-features" className="text-sm font-semibold text-muted hover:text-foreground">Renunță</Link></div>
    </form>
  );
}
