"use client";

import { useActionState } from "react";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";

import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { UploadButton } from "./submit-button";

export function MediaUploadForm({ action }: { action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState> }) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="mb-8">
      <FormSection title="Încarcă imagine" description="JPEG, PNG, WebP sau AVIF, maximum 5 MB. Formatul este verificat din conținut, nu doar din extensie.">
        {state.status === "error" ? <div role="alert" className="mb-5 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{state.message}</div> : null}
        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClass}>Fișier *<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className={`${fieldClass} file:me-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:font-semibold file:text-brand`} /><FieldError errors={errors.file} /></label>
          <label className={labelClass}>Text alternativ *<input name="altText" required minLength={5} className={fieldClass} /><FieldError errors={errors.altText} /></label>
          <label className={labelClass}>Atribuire<input name="attribution" className={fieldClass} placeholder="Fotograf, ilustrator sau deținător drepturi" /></label>
          <label className={labelClass}>Sursă<input name="source" className={fieldClass} placeholder="Editură, autor, arhivă…" /></label>
          <label className={`${labelClass} md:col-span-2`}>URL sursă<input name="sourceUrl" type="url" className={fieldClass} placeholder="https://…" /></label>
        </div>
        <div className="mt-5"><UploadButton /></div>
      </FormSection>
    </form>
  );
}
