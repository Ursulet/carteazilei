"use client";

import { CheckSquare2, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export function BulkBookStatusToolbar({
  action,
  total,
  canPublish,
  canDraft,
}: {
  action: (formData: FormData) => void | Promise<void>;
  total: number;
  canPublish: boolean;
  canDraft: boolean;
}) {
  return (
    <BulkStatusToolbar
      action={action}
      total={total}
      formId="bulk-book-status-form"
      selectionKey="book"
      selectAllLabel="Selectează toate cărțile din listă"
      options={[
        ...(canPublish ? [{ value: "published", label: "Publicată" }] : []),
        ...(canDraft ? [{ value: "draft", label: "Draft" }] : []),
      ]}
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
  selectAllLabel,
  options,
}: {
  action: (formData: FormData) => void | Promise<void>;
  total: number;
  formId: string;
  selectionKey: string;
  selectAllLabel: string;
  options: Array<{ value: string; label: string }>;
}) {
  const [selectedCount, setSelectedCount] = useState(0);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selector = `[data-bulk-selection="${selectionKey}"]`;

  useEffect(() => {
    const checkboxes = () => [...document.querySelectorAll<HTMLInputElement>(selector)];
    const updateCount = () => setSelectedCount(checkboxes().filter((checkbox) => checkbox.checked).length);
    document.addEventListener("change", updateCount);
    updateCount();
    return () => document.removeEventListener("change", updateCount);
  }, [selector]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.checked = total > 0 && selectedCount === total;
    selectAllRef.current.indeterminate = selectedCount > 0 && selectedCount < total;
  }, [selectedCount, total]);

  function toggleAll(checked: boolean) {
    const checkboxes = [...document.querySelectorAll<HTMLInputElement>(selector)];
    for (const checkbox of checkboxes) checkbox.checked = checked;
    setSelectedCount(checked ? checkboxes.length : 0);
  }

  return (
    <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-bold">
        <input ref={selectAllRef} type="checkbox" onChange={(event) => toggleAll(event.currentTarget.checked)} className="size-4 accent-[var(--brand)]" />
        {selectAllLabel}
        <span className="rounded-full bg-paper px-2.5 py-1 text-xs text-muted">{selectedCount}/{total}</span>
      </label>
      <form id={formId} action={action} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="text-sm font-bold">
          Schimbă statusul în
          <select name="status" defaultValue={options[0]?.value} className="ms-3 min-h-10 rounded-xl border border-border bg-paper px-3 font-normal">
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <BulkSubmitButton disabled={!selectedCount} />
      </form>
    </div>
  );
}

function BulkSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? <LoaderCircle aria-hidden="true" className="me-2 size-4 animate-spin" /> : <CheckSquare2 aria-hidden="true" className="me-2 size-4" />}
      {pending ? "Se actualizează…" : "Aplică în masă"}
    </button>
  );
}
