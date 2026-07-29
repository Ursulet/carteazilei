"use client";

import Image from "next/image";
import { useActionState } from "react";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";

import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { UploadButton } from "./submit-button";

export function BookCoverUploadForm({
  action,
  bookTitle,
  currentCoverId,
}: {
  action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState>;
  bookTitle: string;
  currentCoverId?: string | null;
}) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="mb-6">
      <FormSection title="Coperta cărții" description="Imaginea încărcată devine imediat coperta ediției active.">
        {state.status === "error" ? (
          <div role="alert" className="mb-5 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{state.message}</div>
        ) : null}
        <div className="grid gap-5 lg:grid-cols-[10rem_minmax(0,1fr)]">
          <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border bg-paper">
            {currentCoverId ? (
              <Image src={`/media/${currentCoverId}`} alt={`Coperta actuală pentru ${bookTitle}`} fill unoptimized sizes="160px" className="object-contain" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-muted">Fără copertă</span>
            )}
          </div>
          <div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className={labelClass}>Fișier *<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className={`${fieldClass} file:me-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:font-semibold file:text-brand`} /><FieldError errors={errors.file} /></label>
              <label className={labelClass}>Descriere imagine *<input name="altText" required minLength={5} defaultValue={`Coperta cărții ${bookTitle}`} className={fieldClass} /><FieldError errors={errors.altText} /></label>
            </div>
            <details className="mt-5 rounded-xl border border-border bg-paper p-4">
              <summary className="cursor-pointer text-sm font-semibold">Atribuire și sursă (opțional)</summary>
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                <label className={labelClass}>Atribuire<input name="attribution" className={fieldClass} /></label>
                <label className={labelClass}>Sursă<input name="source" className={fieldClass} /></label>
                <label className={`${labelClass} md:col-span-2`}>URL sursă<input name="sourceUrl" type="url" className={fieldClass} /></label>
              </div>
            </details>
            <div className="mt-5"><UploadButton>Încarcă și folosește coperta</UploadButton></div>
          </div>
        </div>
      </FormSection>
    </form>
  );
}
