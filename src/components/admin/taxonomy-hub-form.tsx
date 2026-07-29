"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { EditorialActionState, PublishingGateItem } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";

import { FormSection, fieldClass, labelClass } from "./editorial-ui";
import { PublishingChecklist } from "./publishing-checklist";
import { SubmitButton } from "./submit-button";

type Selection = { bookId: string; position: number | null; reason: string | null; strength: number | null };

export function TaxonomyHubForm({ action, kind, values = {}, books, gate = [] }: {
  action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState>;
  kind: "genre" | "theme" | "mood" | "audience";
  values?: { name?: string | null; slug?: string | null; description?: string | null; searchIntent?: string | null; editorialIntro?: string | null; methodology?: string | null; minimumAge?: number | null; maximumAge?: number | null; status?: string; indexable?: boolean; seoTitle?: string | null; seoDescription?: string | null; selections?: Selection[] };
  books: Array<{ id: string; title: string; author: string; status: string }>;
  gate?: PublishingGateItem[];
}) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const selected = new Map(values.selections?.map((item) => [item.bookId, item]));
  return <form action={formAction} className="grid gap-6">
    {state.status === "error" ? <div role="alert" className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{state.message}</div> : null}
    <FormSection title="Definiția taxonomiei" description="Taxonomia clasifică volumele; câmpurile editoriale decid dacă poate deveni și landing page indexabil."><div className="grid gap-5 md:grid-cols-2"><label className={labelClass}>Nume *<input name="name" required defaultValue={values.name ?? ""} className={fieldClass} /></label><label className={labelClass}>Slug *<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={values.slug ?? ""} className={fieldClass} /></label><label className={labelClass}>Status<select name="status" defaultValue={values.status ?? "draft"} className={fieldClass}><option value="draft">Ciornă</option><option value="published">Publicată</option><option value="archived">Arhivată</option></select></label>{kind === "audience" ? <><label className={labelClass}>Vârstă minimă<input name="minimumAge" type="number" min="0" max="120" defaultValue={values.minimumAge ?? ""} className={fieldClass} /></label><label className={labelClass}>Vârstă maximă<input name="maximumAge" type="number" min="0" max="120" defaultValue={values.maximumAge ?? ""} className={fieldClass} /></label></> : null}<label className={`${labelClass} md:col-span-2`}>Definiție / context de selecție<textarea name="description" rows={4} defaultValue={values.description ?? ""} className={fieldClass} /></label><label className={`${labelClass} md:col-span-2`}>Intenție de căutare<textarea name="searchIntent" rows={3} defaultValue={values.searchIntent ?? ""} className={fieldClass} /></label><label className={`${labelClass} md:col-span-2`}>Introducere editorială<textarea name="editorialIntro" rows={7} defaultValue={values.editorialIntro ?? ""} className={fieldClass} /></label><label className={`${labelClass} md:col-span-2`}>Metodologie<textarea name="methodology" rows={6} defaultValue={values.methodology ?? ""} className={fieldClass} /></label></div></FormSection>
    <FormSection title="Selecția hub-ului" description="Clasificarea și motivul public sunt salvate împreună; editarea cărții păstrează aceste câmpuri."><div className="grid gap-3">{books.map((book, index) => { const current = selected.get(book.id); return <div key={book.id} className="grid gap-3 rounded-xl border border-border bg-paper p-4 md:grid-cols-[auto_5rem_1fr] md:items-start"><label className="flex items-start gap-3 text-sm font-semibold"><input name="bookId" value={book.id} type="checkbox" defaultChecked={Boolean(current)} className="mt-1 size-4 accent-[var(--brand)]" /><span>{book.title}<span className="block text-xs font-normal text-muted">{book.author} · {book.status}</span></span></label><label className="text-xs font-bold text-muted">Poziție<input name={`book.${book.id}.position`} type="number" min="1" defaultValue={current?.position ?? index + 1} className={`${fieldClass} mt-1`} /></label><div className={`grid gap-2 ${kind === "mood" ? "sm:grid-cols-[1fr_7rem]" : ""}`}><label className="text-xs font-bold text-muted">Motiv<textarea name={`book.${book.id}.reason`} rows={2} defaultValue={current?.reason ?? ""} className={`${fieldClass} mt-1`} /></label>{kind === "mood" ? <label className="text-xs font-bold text-muted">Intensitate<input name={`book.${book.id}.strength`} type="number" min="0" max="100" defaultValue={current?.strength ?? 50} className={`${fieldClass} mt-1`} /></label> : null}</div></div>; })}</div></FormSection>
    <FormSection title="SEO și indexare"><div className="grid gap-5"><label className={labelClass}>Titlu SEO<input name="seoTitle" maxLength={70} defaultValue={values.seoTitle ?? ""} className={fieldClass} /></label><label className={labelClass}>Descriere SEO<textarea name="seoDescription" rows={3} maxLength={170} defaultValue={values.seoDescription ?? ""} className={fieldClass} /></label><label className="flex items-center gap-3 text-sm font-semibold"><input name="indexable" type="checkbox" defaultChecked={values.indexable ?? false} className="size-4 accent-[var(--brand)]" />Permite indexarea numai după quality gate</label></div></FormSection>
    {(state.gate ?? gate).length ? <PublishingChecklist items={state.gate ?? gate} /> : null}
    <div className="flex flex-wrap items-center gap-4"><SubmitButton>Salvează taxonomia</SubmitButton><Link href="/admin/taxonomies" className="text-sm font-semibold text-muted hover:text-foreground">Renunță</Link></div>
  </form>;
}
