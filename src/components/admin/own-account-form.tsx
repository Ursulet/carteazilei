"use client";

import { useActionState } from "react";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";

import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { SubmitButton } from "./submit-button";

export function OwnAccountForm({ action, name, email }: { action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState>; name: string; email: string }) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const errors = state.fieldErrors ?? {};
  return <form action={formAction} className="grid gap-6">
    {state.message ? <p role={state.status === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${state.status === "error" ? "border-danger/30 bg-red-50 text-danger" : "border-brand/20 bg-accent-soft text-brand"}`}>{state.message}</p> : null}
    <FormSection title="Datele contului" description="Pentru orice modificare trebuie să confirmi parola curentă.">
      <div className="grid gap-5 md:grid-cols-2">
        <label className={labelClass}>Nume *<input name="name" required maxLength={100} defaultValue={name} className={fieldClass} /><FieldError errors={errors.name} /></label>
        <label className={labelClass}>Email *<input name="email" type="email" required maxLength={254} defaultValue={email} className={fieldClass} /><FieldError errors={errors.email} /></label>
        <label className={`${labelClass} md:col-span-2`}>Parola curentă *<input name="currentPassword" type="password" required maxLength={128} autoComplete="current-password" className={fieldClass} /><FieldError errors={errors.currentPassword} /></label>
      </div>
    </FormSection>
    <FormSection title="Schimbă parola" description="Lasă ambele câmpuri goale dacă vrei să modifici numai numele sau emailul.">
      <div className="grid gap-5 md:grid-cols-2">
        <label className={labelClass}>Parolă nouă<input name="newPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" className={fieldClass} /><FieldError errors={errors.newPassword} /></label>
        <label className={labelClass}>Confirmă parola nouă<input name="confirmPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" className={fieldClass} /><FieldError errors={errors.confirmPassword} /></label>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">Minimum 8 caractere, cu literă mare, literă mică și simbol. După schimbarea emailului sau parolei vei fi autentificat din nou.</p>
    </FormSection>
    <div><SubmitButton>Salvează contul</SubmitButton></div>
  </form>;
}
