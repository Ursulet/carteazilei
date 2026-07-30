"use client";

import Link from "next/link";
import { useActionState } from "react";

import { initialEditorialActionState, type EditorialActionState } from "@/domain/editorial/action-state";
import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { SubmitButton } from "./submit-button";

type Permission = { id: string; code: string; name: string; description: string | null; group: string; dangerous: boolean };

export function RoleForm({ action, permissions, values, editing = false }: { action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState>; permissions: Permission[]; values?: { name: string; description: string | null; active: boolean; permissionIds: string[] }; editing?: boolean }) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const errors = state.fieldErrors ?? {};
  const groups = [...new Set(permissions.map((permission) => permission.group))];
  return <form action={formAction} className="grid gap-6">
    {state.status === "error" ? <p role="alert" className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{state.message}</p> : null}
    <FormSection title="Rol" description="Rolurile custom combină permisiunile existente fără să modifice codul aplicației.">
      <div className="grid gap-5 md:grid-cols-2">
        <label className={labelClass}>Nume *<input name="name" required maxLength={100} defaultValue={values?.name ?? ""} className={fieldClass} /><FieldError errors={errors.name} /></label>
        <label className="flex items-start gap-3 rounded-xl border border-border bg-paper p-4 text-sm font-semibold"><input name="active" type="checkbox" defaultChecked={values?.active ?? true} className="mt-0.5 size-4 accent-[var(--brand)]" /><span>Rol activ<span className="mt-1 block text-xs font-normal text-muted">Rolurile inactive nu pot fi atribuite conturilor noi.</span></span></label>
        <label className={`${labelClass} md:col-span-2`}>Descriere<textarea name="description" rows={3} maxLength={500} defaultValue={values?.description ?? ""} className={fieldClass} /><FieldError errors={errors.description} /></label>
      </div>
    </FormSection>
    <FormSection title="Matrice de permisiuni" description="Fiecare permisiune este verificată pe server. Marcajul «sensibil» indică operațiuni cu impact ridicat.">
      <div className="grid gap-6">{groups.map((group) => <fieldset key={group}><legend className="mb-3 font-display text-xl font-semibold">{group}</legend><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{permissions.filter((permission) => permission.group === group).map((permission) => <label key={permission.id} className="flex items-start gap-3 rounded-xl border border-border bg-paper p-4 text-sm"><input name="permissionIds" value={permission.id} type="checkbox" defaultChecked={values?.permissionIds.includes(permission.id)} className="mt-0.5 size-4 accent-[var(--brand)]" /><span><span className="font-semibold">{permission.name}{permission.dangerous ? <span className="ms-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] text-danger">Sensibil</span> : null}</span><span className="mt-1 block text-xs leading-5 text-muted">{permission.description}</span><code className="mt-2 block text-[10px] text-muted">{permission.code}</code></span></label>)}</div></fieldset>)}</div>
      <FieldError errors={errors.permissionIds} />
    </FormSection>
    <div className="flex items-center gap-4"><SubmitButton>{editing ? "Salvează rolul" : "Creează rolul"}</SubmitButton><Link href="/admin/roles" className="text-sm font-semibold text-muted">Renunță</Link></div>
  </form>;
}
