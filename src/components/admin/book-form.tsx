"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";

import type { EditorialActionState, PublishingGateItem } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";
import { slugify } from "@/lib/slug";

import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { PublishingChecklist } from "./publishing-checklist";
import { InlineMediaPicker } from "./inline-media-picker";

type Option = { id: string; name: string };
type TraitOption = Option & { code: string };

export type BookFormValues = {
  title?: string | null;
  originalTitle?: string | null;
  slug?: string | null;
  authorId?: string | null;
  summary?: string | null;
  verdict?: string | null;
  whyRead?: string | null;
  whyNot?: string | null;
  strengths?: string[];
  caveats?: string[];
  status?: string;
  editorialConfidence?: number;
  editionLabel?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
  publisher?: string | null;
  publicationYear?: number | null;
  language?: string | null;
  pageCount?: number | null;
  coverAssetId?: string | null;
  editionActive?: boolean;
  genreIds?: string[];
  themeIds?: string[];
  moodIds?: string[];
  audienceIds?: string[];
  traitScores?: Array<{ traitId: string; score: number; confidence: number }>;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoCanonical?: string | null;
  seoIndexable?: boolean;
};

type BookOptions = {
  authors: Option[];
  genres: Option[];
  themes: Option[];
  moods: Option[];
  audiences: Option[];
  traits: TraitOption[];
  media: Array<{ id: string; altText: string; storageKey: string }>;
};

function ChoiceGroup({ legend, name, options, selected = [] }: { legend: string; name: string; options: Option[]; selected?: string[] }) {
  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-paper px-3 py-2 text-sm">
            <input type="checkbox" name={name} value={option.id} defaultChecked={selected.includes(option.id)} className="size-4 accent-[var(--brand)]" />
            {option.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function BookForm({ action, values = {}, options, gate = [], bookId, canManageOffers = false }: {
  action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState>;
  values?: BookFormValues;
  options: BookOptions;
  gate?: PublishingGateItem[];
  bookId?: string;
  canManageOffers?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, initialEditorialActionState);
  const errors = state.fieldErrors ?? {};
  const scoreMap = new Map(values.traitScores?.map((item) => [item.traitId, item]));
  const [slug, setSlug] = useState(values.slug ?? "");
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(values.slug));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  function handleTitleChange(title: string) {
    if (!slugWasEdited) setSlug(slugify(title));
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {state.status === "error" ? <div role="alert" className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{state.message}</div> : null}
      <FormSection title="Identitate și flux editorial" description="Datele canonice ale operei și starea ei în circuitul editorial.">
        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClass}>Titlu *<input name="title" required defaultValue={values.title ?? ""} onChange={(event) => handleTitleChange(event.target.value)} className={fieldClass} /><FieldError errors={errors.title} /></label>
          <label className={labelClass}>Titlu original<input name="originalTitle" defaultValue={values.originalTitle ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Adresă URL (generată automat)<input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={(event) => { setSlugWasEdited(true); setSlug(event.target.value); }} onBlur={() => setSlug(slugify(slug))} className={fieldClass} placeholder="se-completează-din-titlu" /><span className="mt-1.5 block text-xs font-normal text-muted">Poți modifica adresa înainte de salvare dacă este necesar.</span><FieldError errors={errors.slug} /></label>
          <label className={labelClass}>Autor *<select name="authorId" required defaultValue={values.authorId ?? ""} className={fieldClass}><option value="">Alege autorul</option>{options.authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}</select><FieldError errors={errors.authorId} />{options.authors.length === 0 ? <span className="mt-2 block text-xs text-danger">Creează mai întâi un autor.</span> : null}</label>
          {bookId ? <label className={labelClass}>Stare<select name="status" defaultValue={values.status ?? "draft"} className={fieldClass}><option value="draft">Ciornă</option><option value="needs_review">Necesită revizie</option><option value="ready">Pregătită</option><option value="published">Publicată</option><option value="archived">Arhivată</option></select></label> : <div className="rounded-xl border border-border bg-paper p-4 text-sm"><input type="hidden" name="status" value="draft" /><span className="font-semibold">Se salvează ca ciornă</span><span className="mt-1 block text-xs leading-5 text-muted">Poți încărca acum coperta. Checklistul va fi obligatoriu abia când alegi publicarea.</span></div>}
          <label className={labelClass}>Încredere editorială: 0–100<input name="editorialConfidence" type="number" min="0" max="100" required defaultValue={values.editorialConfidence ?? 0} className={fieldClass} /></label>
        </div>
      </FormSection>

      <FormSection title="Conținut editorial" description="Text fără spoilere, argumente și limite explicite.">
        <div className="grid gap-5">
          <label className={labelClass}>Verdict scurt<textarea name="verdict" rows={3} defaultValue={values.verdict ?? ""} className={fieldClass} /></label>
          <div className="grid gap-5 md:grid-cols-2">
            <label className={labelClass}>Merită să o citești dacă…<textarea name="whyRead" rows={5} defaultValue={values.whyRead ?? ""} className={fieldClass} /></label>
            <label className={labelClass}>Poate să nu fie pentru tine dacă…<textarea name="whyNot" rows={5} defaultValue={values.whyNot ?? ""} className={fieldClass} /></label>
          </div>
          <label className={labelClass}>Rezumat fără spoilere<textarea name="summary" rows={7} defaultValue={values.summary ?? ""} className={fieldClass} /></label>
          <div className="grid gap-5 md:grid-cols-2">
            <label className={labelClass}>Puncte forte — unul pe linie<textarea name="strengths" rows={6} defaultValue={values.strengths?.join("\n") ?? ""} className={fieldClass} /></label>
            <label className={labelClass}>Rezerve — una pe linie<textarea name="caveats" rows={6} defaultValue={values.caveats?.join("\n") ?? ""} className={fieldClass} /></label>
          </div>
        </div>
      </FormSection>

      <FormSection title="Ediție și copertă" description="Poți alege o imagine existentă sau o poți încărca direct aici, fără să părăsești formularul.">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <label className={labelClass}>Eticheta ediției<input name="editionLabel" defaultValue={values.editionLabel ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>ISBN-10<input name="isbn10" inputMode="numeric" defaultValue={values.isbn10 ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>ISBN-13<input name="isbn13" inputMode="numeric" defaultValue={values.isbn13 ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Editură<input name="publisher" defaultValue={values.publisher ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>An publicare<input name="publicationYear" type="number" min="1450" max="3000" defaultValue={values.publicationYear ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Număr pagini<input name="pageCount" type="number" min="1" defaultValue={values.pageCount ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Limbă<input name="language" defaultValue={values.language ?? "ro"} className={fieldClass} /></label>
          <label className={`${labelClass} md:col-span-2`}>Copertă<InlineMediaPicker name="coverAssetId" value={values.coverAssetId} media={options.media} empty="Fără copertă" /><FieldError errors={errors.coverAssetId} /></label>
          <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" name="editionActive" defaultChecked={values.editionActive ?? true} className="size-4 accent-[var(--brand)]" />Ediție activă</label>
        </div>
      </FormSection>

      <FormSection title="Taxonomie" description="Prima selecție de gen devine genul principal.">
        <div className="grid gap-6 lg:grid-cols-2">
          <ChoiceGroup legend="Genuri" name="genreIds" options={options.genres} selected={values.genreIds} />
          <ChoiceGroup legend="Teme" name="themeIds" options={options.themes} selected={values.themeIds} />
          <ChoiceGroup legend="Atmosferă" name="moodIds" options={options.moods} selected={values.moodIds} />
          <ChoiceGroup legend="Audiențe" name="audienceIds" options={options.audiences} selected={values.audienceIds} />
        </div>
      </FormSection>

      <FormSection title="Scoruri de lectură" description="Lasă necompletat un scor care nu a fost evaluat. Încrederea notează siguranța evaluării.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted"><tr><th className="pb-3">Trăsătură</th><th className="pb-3">Scor</th><th className="pb-3">Încredere</th></tr></thead>
            <tbody>{options.traits.map((trait) => { const score = scoreMap.get(trait.id); return <tr key={trait.id} className="border-b border-border/70"><td className="py-3 pe-4 font-semibold"><input type="hidden" name="traitId" value={trait.id} />{trait.name}<span className="block text-xs font-normal text-muted">{trait.code}</span></td><td className="py-3 pe-4"><input aria-label={`Scor ${trait.name}`} name={`trait.${trait.id}.score`} type="number" min="0" max="100" defaultValue={score?.score ?? ""} className={`${fieldClass} mt-0 max-w-28`} /></td><td className="py-3"><input aria-label={`Încredere ${trait.name}`} name={`trait.${trait.id}.confidence`} type="number" min="0" max="100" defaultValue={score?.confidence ?? ""} className={`${fieldClass} mt-0 max-w-28`} /></td></tr>; })}</tbody>
          </table>
        </div>
      </FormSection>

      <FormSection title="Suprascrieri SEO" description="Completează numai când titlul sau descrierea editorială implicită nu este potrivită. JSON-LD este generat de aplicație.">
        <div className="grid gap-5">
          <label className={labelClass}>Titlu SEO<input name="seoTitle" maxLength={70} defaultValue={values.seoTitle ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Descriere SEO<textarea name="seoDescription" maxLength={170} rows={3} defaultValue={values.seoDescription ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Canonical override (HTTPS)<input name="seoCanonical" type="url" defaultValue={values.seoCanonical ?? ""} className={fieldClass} /></label>
          <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" name="seoIndexable" defaultChecked={values.seoIndexable ?? false} className="size-4 accent-[var(--brand)]" />Permite indexarea după publicare</label>
        </div>
      </FormSection>

      {(state.gate ?? gate).length ? <PublishingChecklist items={state.gate ?? gate} /> : null}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isPending} className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60">{isPending ? "Se salvează…" : bookId ? "Salvează modificările" : "Creează ciorna"}</button>
        {bookId && canManageOffers ? <Link href={`/admin/books/${bookId}/offers`} className="inline-flex min-h-11 items-center rounded-full border border-brand px-5 text-sm font-bold text-brand hover:bg-accent-soft">Oferte & afiliere</Link> : null}
        {bookId ? <Link href={`/admin/preview/book/${bookId}`} target="_blank" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Previzualizare protejată</Link> : null}
        <Link href="/admin/books" className="text-sm font-semibold text-muted hover:text-foreground">Renunță</Link>
      </div>
    </form>
  );
}
