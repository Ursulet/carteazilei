"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import type { EditorialActionState, PublishingGateItem } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";
import { slugify } from "@/lib/slug";

import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { PublishingChecklist } from "./publishing-checklist";
import { SubmitButton } from "./submit-button";

type BookOption = { id: string; title: string; author: string; status: string };
type Selection = { bookId: string; position: number; reason: string; segment?: string | null };
type SelectionDraft = { position: string; reason: string; segment: string };

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

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
  const errors = state.fieldErrors ?? {};
  const [slug, setSlug] = useState(values.slug ?? "");
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(values.slug));
  const [bookSearch, setBookSearch] = useState("");
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>(() =>
    [...(values.selections ?? [])].sort((left, right) => left.position - right.position).map((item) => item.bookId),
  );
  const [selectionDrafts, setSelectionDrafts] = useState<Record<string, SelectionDraft>>(() =>
    Object.fromEntries((values.selections ?? []).map((item) => [item.bookId, {
      position: String(item.position),
      reason: item.reason,
      segment: item.segment ?? "",
    }])),
  );
  const bookById = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);
  const selectedBookIdSet = useMemo(() => new Set(selectedBookIds), [selectedBookIds]);
  const filteredBooks = useMemo(() => {
    const query = normalizeSearch(bookSearch);
    if (!query) return books;
    return books.filter((book) => normalizeSearch(`${book.title} ${book.author}`).includes(query));
  }, [bookSearch, books]);

  function handleTitleChange(title: string) {
    if (!slugWasEdited) setSlug(slugify(title));
  }

  function toggleBook(bookId: string, checked: boolean) {
    if (!checked) {
      setSelectedBookIds((current) => current.filter((id) => id !== bookId));
      return;
    }
    if (selectedBookIdSet.has(bookId)) return;
    const nextPosition = Math.max(0, ...selectedBookIds.map((id) => Number(selectionDrafts[id]?.position) || 0)) + 1;
    setSelectionDrafts((current) => current[bookId] ? current : {
      ...current,
      [bookId]: { position: String(nextPosition), reason: "", segment: "" },
    });
    setSelectedBookIds((current) => [...current, bookId]);
  }

  function updateSelection(bookId: string, field: keyof SelectionDraft, value: string) {
    setSelectionDrafts((current) => ({
      ...current,
      [bookId]: {
        ...(current[bookId] ?? { position: "", reason: "", segment: "" }),
        [field]: value,
      },
    }));
  }

  return (
    <form action={formAction} className="grid gap-6">
      {state.status === "error" ? <div role="alert" className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{state.message}</div> : null}
      <FormSection title="Identitatea selecției" description="Tipul stabilește URL-ul canonical; hub-ul de lungime este publicat numai sub /carti/lungime.">
        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClass}>Titlu *<input name="title" required defaultValue={values.title ?? ""} onChange={(event) => handleTitleChange(event.target.value)} className={fieldClass} /><FieldError errors={errors.title} /></label>
          <label className={labelClass}>Adresă URL (generată automat)<input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={(event) => { setSlugWasEdited(true); setSlug(event.target.value); }} onBlur={() => setSlug(slugify(slug))} className={fieldClass} placeholder="se-completează-din-titlu" /><span className="mt-1.5 block text-xs font-normal text-muted">Poți modifica adresa înainte de salvare dacă este necesar.</span><FieldError errors={errors.slug} /></label>
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
        {books.length ? (
          <div className="grid gap-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-paper">
              <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <label className="relative block">
                  <span className="sr-only">Caută o carte</span>
                  <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <input type="search" value={bookSearch} onChange={(event) => setBookSearch(event.target.value)} placeholder="Caută după titlu sau autor…" className={`${fieldClass} ps-11`} />
                </label>
                <p className="text-sm font-semibold text-muted">{selectedBookIds.length} selectate · {filteredBooks.length} afișate</p>
              </div>
              <div className="max-h-[28rem] divide-y divide-border overflow-y-auto">
                {filteredBooks.map((book) => (
                  <label key={book.id} className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-surface ${selectedBookIdSet.has(book.id) ? "bg-accent-soft/45" : ""}`}>
                    <input type="checkbox" checked={selectedBookIdSet.has(book.id)} onChange={(event) => toggleBook(book.id, event.target.checked)} className="size-4 shrink-0 accent-[var(--brand)]" />
                    <span className="min-w-0 flex-1 text-sm font-semibold">
                      <span className="block truncate">{book.title}</span>
                      <span className="mt-0.5 block truncate text-xs font-normal text-muted">{book.author}</span>
                    </span>
                    <span className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[0.68rem] font-bold text-muted">{book.status}</span>
                  </label>
                ))}
                {filteredBooks.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted">Nu am găsit nicio carte pentru această căutare.</p> : null}
              </div>
            </div>

            {selectedBookIds.length ? (
              <div>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <h3 className="font-display text-xl font-semibold">Detaliile cărților selectate</h3>
                  <p className="text-xs text-muted">Completează motivul numai pentru titlurile bifate.</p>
                </div>
                <div className="grid gap-3">
                  {selectedBookIds.map((bookId, index) => {
                    const book = bookById.get(bookId);
                    if (!book) return null;
                    const current = selectionDrafts[bookId] ?? { position: String(index + 1), reason: "", segment: "" };
                    return (
                      <div key={book.id} className="grid gap-3 rounded-xl border border-border bg-paper p-4 md:grid-cols-[minmax(12rem,0.7fr)_5rem_minmax(18rem,1.3fr)] md:items-start">
                        <input type="hidden" name="bookId" value={book.id} />
                        <div className="min-w-0 text-sm font-semibold">
                          <span className="block">{book.title}</span>
                          <span className="mt-1 block text-xs font-normal text-muted">{book.author}</span>
                        </div>
                        <label className="text-xs font-bold text-muted">Poziție<input aria-label={`Poziție ${book.title}`} name={`book.${book.id}.position`} type="number" min="1" value={current.position} onChange={(event) => updateSelection(book.id, "position", event.target.value)} className={`${fieldClass} mt-1`} /></label>
                        <div className="grid gap-2">
                          <label className="text-xs font-bold text-muted">Motiv<textarea aria-label={`Motiv ${book.title}`} name={`book.${book.id}.reason`} rows={2} value={current.reason} onChange={(event) => updateSelection(book.id, "reason", event.target.value)} className={`${fieldClass} mt-1`} /></label>
                          <label className="text-xs font-bold text-muted">Segment opțional<input aria-label={`Segment ${book.title}`} name={`book.${book.id}.segment`} value={current.segment} onChange={(event) => updateSelection(book.id, "segment", event.target.value)} className={`${fieldClass} mt-1`} /></label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">Nu ai selectat încă nicio carte.</p>}
          </div>
        ) : <p className="text-sm text-muted">Nu există cărți disponibile.</p>}
      </FormSection>
      <FormSection title="SEO și quality gate" description="Metadata trebuie să fie specifică acestei pagini, nu o copie a altei selecții.">
        <div className="grid gap-5"><label className={labelClass}>Titlu SEO<input name="seoTitle" maxLength={70} defaultValue={values.seoTitle ?? ""} className={fieldClass} /></label><label className={labelClass}>Descriere SEO<textarea name="seoDescription" rows={3} maxLength={170} defaultValue={values.seoDescription ?? ""} className={fieldClass} /></label><label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" name="indexable" defaultChecked={values.indexable ?? false} className="size-4 accent-[var(--brand)]" />Permite indexarea numai dacă trece quality gate-ul</label></div>
      </FormSection>
      {(state.gate ?? gate).length ? <PublishingChecklist items={state.gate ?? gate} /> : null}
      <div className="flex flex-wrap items-center gap-4"><SubmitButton>Salvează selecția</SubmitButton><Link href="/admin/lists" className="text-sm font-semibold text-muted hover:text-foreground">Renunță</Link></div>
    </form>
  );
}
