"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";

import { FormSection, fieldClass, labelClass } from "./editorial-ui";
import { SubmitButton } from "./submit-button";

const relationshipLabels = { similar_theme: "Temă similară", similar_style: "Stil similar", similar_pace: "Ritm similar", similar_world: "Lume similară", next_read: "Ce să citești după", contrast_read: "Lectură în contrast" };

export function BookRelationshipForm({ action, books, values = {} }: {
  action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState>;
  books: Array<{ id: string; title: string; author: string; status: string }>;
  values?: { sourceBookId?: string; targetBookId?: string; type?: string; nextReadBasis?: string | null; strength?: number; publicReason?: string | null; provenance?: string; active?: boolean };
}) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  return <form action={formAction} className="grid gap-6">
    {state.status === "error" ? <div role="alert" className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{state.message}</div> : null}
    <FormSection title="Relația editorială" description="Sursa definește pagina pe care apare destinația. Relația nu este creată automat în sens invers."><div className="grid gap-5 md:grid-cols-2"><label className={labelClass}>Carte sursă *<select name="sourceBookId" required defaultValue={values.sourceBookId ?? ""} className={fieldClass}><option value="">Alege cartea</option>{books.map((book) => <option key={book.id} value={book.id}>{book.title} — {book.author}</option>)}</select></label><label className={labelClass}>Carte recomandată *<select name="targetBookId" required defaultValue={values.targetBookId ?? ""} className={fieldClass}><option value="">Alege cartea</option>{books.map((book) => <option key={book.id} value={book.id}>{book.title} — {book.author}</option>)}</select></label><label className={labelClass}>Tip<select name="type" defaultValue={values.type ?? "similar_theme"} className={fieldClass}>{Object.entries(relationshipLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className={labelClass}>Ce continuă? <select name="nextReadBasis" defaultValue={values.nextReadBasis ?? ""} className={fieldClass}><option value="">Nu se aplică</option><option value="theme">Tema</option><option value="pace">Ritmul</option><option value="style">Stilul</option><option value="world">Lumea</option><option value="emotional_effect">Efectul emoțional</option></select><span className="mt-1 block text-xs font-normal text-muted">Obligatoriu numai pentru „Ce să citești după”.</span></label><label className={labelClass}>Forță 0–100<input name="strength" required type="number" min="0" max="100" defaultValue={values.strength ?? 70} className={fieldClass} /></label><label className={labelClass}>Proveniență<select name="provenance" defaultValue={values.provenance ?? "editorial"} className={fieldClass}><option value="editorial">Editorială</option><option value="algorithmic">Propunere algoritmică revizuită</option></select></label><label className={`${labelClass} md:col-span-2`}>Motiv public<textarea name="publicReason" rows={5} maxLength={1000} defaultValue={values.publicReason ?? ""} className={fieldClass} /></label><label className="flex items-center gap-3 text-sm font-semibold"><input name="active" type="checkbox" defaultChecked={values.active ?? false} className="size-4 accent-[var(--brand)]" />Aprobă și activează relația</label></div></FormSection>
    <div className="flex flex-wrap items-center gap-4"><SubmitButton>Salvează relația</SubmitButton><Link href="/admin/relationships" className="text-sm font-semibold text-muted hover:text-foreground">Renunță</Link></div>
  </form>;
}
