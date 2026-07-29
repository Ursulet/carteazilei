"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { EditorialActionState, PublishingGateItem } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";

import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { PublishingChecklist } from "./publishing-checklist";
import { SubmitButton } from "./submit-button";

type BookOption = { id: string; title: string; author: string; status: string };
type Selection = { bookId: string; position: number; reason: string; segment?: string | null };

export function EditorialListForm({ action, values = {}, books, gate = [] }: {
  action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState>;
  values?: {
    title?: string | null; slug?: string | null; intro?: string | null; methodology?: string | null;
    type?: string; minimumPageCount?: number | null; maximumPageCount?: number | null;
    status?: string; indexable?: boolean; seoTitle?: string | null; seoDescription?: string | null;
    selections?: Selection[];
  };
  books: BookOption[];
  gate?: PublishingGateItem[];
}) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const selected = new Map(values.selections?.map((item) => [item.bookId, item]));
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="grid gap-6">
      {state.status === "error" ? <div role="alert" className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{state.message}</div> : null}
      <FormSection title="Identitatea selecției" description="Tipul stabilește URL-ul canonical; hub-ul de lungime este publicat numai sub /carti/lungime.">
        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClass}>Titlu *<input name="title" required defaultValue={values.title ?? ""} className={fieldClass} /><FieldError errors={errors.title} /></label>
          <label className={labelClass}>Slug *<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={values.slug ?? ""} className={fieldClass} /><FieldError errors={errors.slug} /></label>
          <label className={labelClass}>Tip<select name="type" defaultValue={values.type ?? "list"} className={fieldClass}><option value="list">Listă</option><option value="guide">Ghid</option><option value="hub">Hub editorial</option><option value="length_hub">Hub după lungime</option></select></label>
          <label className={labelClass}>Status<select name="status" defaultValue={values.status ?? "draft"} className={fieldClass}><option value="draft">Ciornă</option><option value="review">În revizie</option><option value="published">Publicată</option><option value="archived">Arhivată</option></select></label>
          <label className={labelClass}>Minimum pagini<input name="minimumPageCount" type="number" min="0" defaultValue={values.minimumPageCount ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Maximum pagini<input name="maximumPageCount" type="number" min="1" defaultValue={values.maximumPageCount ?? ""} className={fieldClass} /><span className="mt-1 block text-xs font-normal text-muted">Intervalul se completează numai pentru tipul „Hub după lungime”.</span></label>
        </div>
      </FormSection>
      <FormSection title="Conținut editorial" description="Introducerea explică intenția, iar metodologia explică de ce au fost alese titlurile.">
        <div className="grid gap-5"><label className={labelClass}>Introducere editorială<textarea name="intro" rows={8} defaultValue={values.intro ?? ""} className={fieldClass} /></label><label className={labelClass}>Metodologie / context de selecție<textarea name="methodology" rows={6} defaultValue={values.methodology ?? ""} className={fieldClass} /></label></div>
      </FormSection>
      <FormSection title="Cărți și motive" description="Bifează numai titlurile relevante. Fiecare selecție publică are motiv propriu și poziție explicită.">
        <div className="grid gap-3">{books.map((book, index) => { const current = selected.get(book.id); return <div key={book.id} className="grid gap-3 rounded-xl border border-border bg-paper p-4 md:grid-cols-[auto_5rem_1fr] md:items-start"><label className="flex min-w-0 items-start gap-3 text-sm font-semibold"><input type="checkbox" name="bookId" value={book.id} defaultChecked={Boolean(current)} className="mt-1 size-4 accent-[var(--brand)]" /><span>{book.title}<span className="block text-xs font-normal text-muted">{book.author} · {book.status}</span></span></label><label className="text-xs font-bold text-muted">Poziție<input aria-label={`Poziție ${book.title}`} name={`book.${book.id}.position`} type="number" min="1" defaultValue={current?.position ?? index + 1} className={`${fieldClass} mt-1`} /></label><div className="grid gap-2"><label className="text-xs font-bold text-muted">Motiv<textarea aria-label={`Motiv ${book.title}`} name={`book.${book.id}.reason`} rows={2} defaultValue={current?.reason ?? ""} className={`${fieldClass} mt-1`} /></label><label className="text-xs font-bold text-muted">Segment opțional<input aria-label={`Segment ${book.title}`} name={`book.${book.id}.segment`} defaultValue={current?.segment ?? ""} className={`${fieldClass} mt-1`} /></label></div></div>; })}</div>
        {books.length === 0 ? <p className="text-sm text-muted">Nu există cărți disponibile.</p> : null}
      </FormSection>
      <FormSection title="SEO și quality gate" description="Metadata trebuie să fie specifică acestei pagini, nu o copie a altei selecții.">
        <div className="grid gap-5"><label className={labelClass}>Titlu SEO<input name="seoTitle" maxLength={70} defaultValue={values.seoTitle ?? ""} className={fieldClass} /></label><label className={labelClass}>Descriere SEO<textarea name="seoDescription" rows={3} maxLength={170} defaultValue={values.seoDescription ?? ""} className={fieldClass} /></label><label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" name="indexable" defaultChecked={values.indexable ?? false} className="size-4 accent-[var(--brand)]" />Permite indexarea numai dacă trece quality gate-ul</label></div>
      </FormSection>
      {(state.gate ?? gate).length ? <PublishingChecklist items={state.gate ?? gate} /> : null}
      <div className="flex flex-wrap items-center gap-4"><SubmitButton>Salvează selecția</SubmitButton><Link href="/admin/lists" className="text-sm font-semibold text-muted hover:text-foreground">Renunță</Link></div>
    </form>
  );
}
