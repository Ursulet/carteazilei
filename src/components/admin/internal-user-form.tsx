"use client";

import Link from "next/link";
import { useActionState } from "react";
import { initialEditorialActionState, type EditorialActionState } from "@/domain/editorial/action-state";
import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { SubmitButton } from "./submit-button";
import { InlineMediaPicker } from "./inline-media-picker";

type Role = { id: string; code: string; name: string; description: string | null; isSuperAdmin: boolean };
type Values = { name?: string; email?: string; avatarAssetId?: string | null; phone?: string | null; internalNotes?: string | null; locale?: string; timezone?: string; status?: string; suspendedUntil?: Date | null; roleIds?: string[]; mustResetPassword?: boolean };
type Media = Array<{ id: string; altText: string }>;

export function InternalUserForm({ action, roles, media, values = {}, editing = false }: { action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState>; roles: Role[]; media: Media; values?: Values; editing?: boolean }) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const errors = state.fieldErrors ?? {};
  return <form action={formAction} className="grid gap-6">
    {state.status === "error" ? <p role="alert" className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{state.message}</p> : null}
    <FormSection title="Date de autentificare" description="Emailul identifică utilizatorul. Modificările sensibile revocă automat sesiunile active.">
      <div className="grid gap-5 md:grid-cols-2">
        <label className={labelClass}>Nume *<input name="name" required maxLength={100} defaultValue={values.name ?? ""} className={fieldClass} /><FieldError errors={errors.name} /></label>
        <label className={labelClass}>Email *<input name="email" type="email" required maxLength={254} defaultValue={values.email ?? ""} className={fieldClass} /><FieldError errors={errors.email} /></label>
        <label className={`${labelClass} md:col-span-2`}>Imagine de profil<InlineMediaPicker name="avatarAssetId" value={values.avatarAssetId} media={media} empty="Fără avatar" /><FieldError errors={errors.avatarAssetId} /></label>
        <label className={labelClass}>Telefon<input name="phone" type="tel" maxLength={50} defaultValue={values.phone ?? ""} className={fieldClass} /></label>
        <label className={labelClass}>Status<select name="status" defaultValue={values.status ?? "active"} className={fieldClass}><option value="active">Activ</option><option value="suspended">Suspendat temporar</option><option value="disabled">Dezactivat</option><option value="invited">Invitat</option><option value="archived">Arhivat</option></select></label>
        <label className={labelClass}>Suspendat până la<input name="suspendedUntil" type="datetime-local" defaultValue={values.suspendedUntil ? new Date(values.suspendedUntil.getTime() - values.suspendedUntil.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : ""} className={fieldClass} /><FieldError errors={errors.suspendedUntil} /></label>
        <label className={labelClass}>Limbă<select name="locale" defaultValue={values.locale ?? "ro"} className={fieldClass}><option value="ro">Română</option><option value="en">English</option></select></label>
        <label className={labelClass}>Fus orar<input name="timezone" required maxLength={100} defaultValue={values.timezone ?? "Europe/Bucharest"} className={fieldClass} /></label>
        <label className={`${labelClass} md:col-span-2`}>{editing ? "Parolă nouă" : "Parolă inițială"}<input name="newPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" className={fieldClass} /><span className="mt-1.5 block text-xs font-normal leading-5 text-muted">Minimum 8 caractere, cu literă mare, literă mică și simbol. {editing ? "Lasă gol pentru a păstra parola actuală." : "Nu este necesară dacă trimiți invitație."}</span><FieldError errors={errors.newPassword} /></label>
        {!editing ? <label className="flex items-start gap-3 rounded-xl border border-border bg-paper p-4 text-sm font-semibold md:col-span-2"><input name="invite" type="checkbox" className="mt-0.5 size-4 accent-[var(--brand)]" /><span>Trimite invitație<span className="mt-1 block text-xs font-normal text-muted">Contul rămâne inactiv până când utilizatorul își setează parola. Linkul de activare va fi afișat după salvare.</span></span></label> : null}
        <label className="flex items-start gap-3 rounded-xl border border-border bg-paper p-4 text-sm font-semibold md:col-span-2"><input name="mustResetPassword" type="checkbox" defaultChecked={values.mustResetPassword} className="mt-0.5 size-4 accent-[var(--brand)]" /><span>Solicită schimbarea parolei<span className="mt-1 block text-xs font-normal text-muted">Utilizatorul va trebui să aleagă o parolă nouă.</span></span></label>
        <label className={`${labelClass} md:col-span-2`}>Notițe interne<textarea name="internalNotes" rows={4} maxLength={2000} defaultValue={values.internalNotes ?? ""} className={fieldClass} /><span className="mt-1.5 block text-xs font-normal text-muted">Nu sunt afișate utilizatorului sau public.</span></label>
      </div>
    </FormSection>
    <FormSection title="Roluri și permisiuni" description="Permisiunile rolurilor sunt verificate server-side la fiecare pagină și acțiune.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{roles.map((role) => <label key={role.id} className="flex items-start gap-3 rounded-xl border border-border bg-paper p-4 text-sm font-semibold"><input type="checkbox" name="roleIds" value={role.id} defaultChecked={values.roleIds?.includes(role.id)} className="mt-0.5 size-4 accent-[var(--brand)]" /><span>{role.name}{role.isSuperAdmin ? <span className="ms-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] text-danger">Protejat</span> : null}<span className="mt-1 block text-xs font-normal leading-5 text-muted">{role.description}</span></span></label>)}</div><FieldError errors={errors.roleIds} />
    </FormSection>
    <div className="flex flex-wrap items-center gap-3"><SubmitButton>{editing ? "Salvează utilizatorul" : "Creează utilizatorul"}</SubmitButton><Link href="/admin/editors" className="text-sm font-semibold text-muted hover:text-foreground">Renunță</Link></div>
  </form>;
}
