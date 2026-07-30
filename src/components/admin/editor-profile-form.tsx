"use client";

import Link from "next/link";
import { useActionState } from "react";

import { initialEditorialActionState, type EditorialActionState } from "@/domain/editorial/action-state";

import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { SubmitButton } from "./submit-button";
import { InlineMediaPicker } from "./inline-media-picker";

type EditorProfileValues = {
  displayName: string;
  slug: string;
  bio: string | null;
  expertise: string[];
  avatarAssetId: string | null;
  publicProfile: boolean;
  email: string;
};

export function EditorProfileForm({
  action,
  values,
  media,
}: {
  action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState>;
  values: EditorProfileValues;
  media: Array<{ id: string; altText: string }>;
}) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="grid gap-6">
      {state.status === "error" ? <div role="alert" className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{state.message}</div> : null}
      <FormSection title="Identitate publică" description={`Cont intern: ${values.email}. Adresa nu este afișată public.`}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClass}>Nume public *<input name="displayName" required defaultValue={values.displayName} className={fieldClass} /><FieldError errors={errors.displayName} /></label>
          <label className={labelClass}>Slug *<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={values.slug} className={fieldClass} /><FieldError errors={errors.slug} /></label>
          <label className={`${labelClass} md:col-span-2`}>Biografie<textarea name="bio" rows={8} defaultValue={values.bio ?? ""} className={fieldClass} /><FieldError errors={errors.bio} /></label>
          <label className={`${labelClass} md:col-span-2`}>Domenii de expertiză, câte unul pe linie<textarea name="expertise" rows={5} defaultValue={values.expertise.join("\n")} className={fieldClass} /><FieldError errors={errors.expertise} /></label>
          <label className={labelClass}>Portret<InlineMediaPicker name="avatarAssetId" value={values.avatarAssetId} media={media} empty="Fără imagine" /><FieldError errors={errors.avatarAssetId} /></label>
          <label className="flex items-start gap-3 rounded-xl border border-border bg-paper p-4 text-sm font-semibold"><input name="publicProfile" type="checkbox" defaultChecked={values.publicProfile} className="mt-0.5 size-4 accent-brand" /><span>Publică profilul<span className="mt-1 block text-xs font-normal leading-5 text-muted">Necesită biografie. Profilul va apărea în `/echipa` și `/editor/[slug]`.</span></span></label>
        </div>
      </FormSection>
      <div className="flex flex-wrap items-center gap-3"><SubmitButton>Salvează profilul</SubmitButton><Link href="/admin/editors" className="text-sm font-semibold text-muted hover:text-foreground">Renunță</Link></div>
    </form>
  );
}
