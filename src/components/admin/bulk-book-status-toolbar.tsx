"use client";

import { CheckSquare2, LoaderCircle, Tags } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export function BulkBookStatusToolbar({
  action,
  total,
  canPublish,
  canDraft,
  genreAction,
  genres,
}: {
  action: (formData: FormData) => void | Promise<void>;
  total: number;
  canPublish: boolean;
  canDraft: boolean;
  genreAction?: (formData: FormData) => void | Promise<void>;
  genres?: Array<{ id: string; name: string }>;
}) {
  return (
    <BulkStatusToolbar
      action={action}
      total={total}
      formId="bulk-book-status-form"
      selectionKey="book"
      selectionInputName="bookIds"
      selectAllLabel="Selectează toate cărțile din listă"
      options={[
        ...(canPublish ? [{ value: "published", label: "Publicată" }] : []),
        ...(canDraft ? [{ value: "draft", label: "Draft" }] : []),
      ]}
      genreAction={genreAction}
      genres={genres}
    />
  );
}

export function BulkAuthorStatusToolbar({
  action,
  total,
}: {
  action: (formData: FormData) => void | Promise<void>;
  total: number;
}) {
  return (
    <BulkStatusToolbar
      action={action}
      total={total}
      formId="bulk-author-status-form"
      selectionKey="author"
      selectionInputName="authorIds"
      selectAllLabel="Selectează toți autorii din listă"
      options={[
        { value: "published", label: "Publicat" },
        { value: "draft", label: "Draft" },
      ]}
    />
  );
}

function BulkStatusToolbar({
  action,
  total,
  formId,
  selectionKey,
  selectionInputName,
  selectAllLabel,
  options,
  genreAction,
  genres,
}: {
  action: (formData: FormData) => void | Promise<void>;
  total: number;
  formId: string;
  selectionKey: string;
  selectionInputName: string;
  selectAllLabel: string;
  options: Array<{ value: string; label: string }>;
  genreAction?: (formData: FormData) => void | Promise<void>;
  genres?: Array<{ id: string; name: string }>;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selector = `[data-bulk-selection="${selectionKey}"]`;
  const selectedCount = selectedIds.length;

  useEffect(() => {
    const checkboxes = () => [...document.querySelectorAll<HTMLInputElement>(selector)];
    const updateSelection = () => setSelectedIds(checkboxes().filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value));
    document.addEventListener("change", updateSelection);
    updateSelection();
    return () => document.removeEventListener("change", updateSelection);
  }, [selector]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.checked = total > 0 && selectedCount === total;
    selectAllRef.current.indeterminate = selectedCount > 0 && selectedCount < total;
  }, [selectedCount, total]);

  function toggleAll(checked: boolean) {
    const checkboxes = [...document.querySelectorAll<HTMLInputElement>(selector)];
    for (const checkbox of checkboxes) checkbox.checked = checked;
    setSelectedIds(checked ? checkboxes.map((checkbox) => checkbox.value) : []);
  }

  return (
    <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-bold">
        <input ref={selectAllRef} type="checkbox" onChange={(event) => toggleAll(event.currentTarget.checked)} className="size-4 accent-[var(--brand)]" />
        {selectAllLabel}
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs text-muted">{selectedCount}/{total}</span>
      </label>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <form id={formId} action={action} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {selectedIds.map((id) => <input key={id} type="hidden" name={selectionInputName} value={id} />)}
          <label className="text-sm font-bold">
            Schimbă statusul în
            <select name="status" defaultValue={options[0]?.value} className="ms-3 min-h-10 rounded-xl border border-border bg-paper px-3 font-normal">
              {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <BulkSubmitButton disabled={!selectedCount} label="Aplică în masă" pendingLabel="Se actualizează…" />
        </form>
        {genreAction && genres?.length ? (
          <form action={genreAction} className="flex flex-col gap-3 border-border sm:flex-row sm:items-center xl:border-s xl:ps-4">
            {selectedIds.map((id) => <input key={id} type="hidden" name="bookIds" value={id} />)}
            <label className="text-sm font-bold">
              Adaugă genul
              <select name="genreId" required defaultValue="" className="ms-3 min-h-10 max-w-56 rounded-xl border border-border bg-paper px-3 font-normal">
                <option value="" disabled>Alege genul</option>
                {genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}
              </select>
            </label>
            <BulkSubmitButton disabled={!selectedCount} label="Adaugă genul" pendingLabel="Se adaugă…" genre />
          </form>
        ) : null}
      </div>
    </div>
  );
}

function BulkSubmitButton({ disabled, label, pendingLabel, genre = false }: { disabled: boolean; label: string; pendingLabel: string; genre?: boolean }) {
  const { pending } = useFormStatus();
  const Icon = genre ? Tags : CheckSquare2;
  return (
    <button type="submit" disabled={disabled || pending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? <LoaderCircle aria-hidden="true" className="me-2 size-4 animate-spin" /> : <Icon aria-hidden="true" className="me-2 size-4" />}
      {pending ? pendingLabel : label}
    </button>
  );
}
