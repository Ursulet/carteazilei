"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";

import { FieldError, FormSection, fieldClass, labelClass } from "./editorial-ui";
import { InlineMediaPicker } from "./inline-media-picker";
import { SubmitButton } from "./submit-button";

export type AuthorFormValues = {
  name?: string | null;
  slug?: string | null;
  bio?: string | null;
  portraitAssetId?: string | null;
  verifiedFacts?: string | null;
  sourceNotes?: string | null;
  status?: string;
};

export function AuthorForm({
  action,
  values = {},
  media = [],
  editing = false,
}: {
  action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState>;
  values?: AuthorFormValues;
  media?: Array<{ id: string; altText: string }>;
  editing?: boolean;
}) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-6">
      {state.status === "error" ? <div role="alert" className="rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{state.message}</div> : null}
      <FormSection title="Profil public" description="Numele, portretul și biografia sunt afișate pe pagina publică a autorului.">
        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClass}>Nume *<input name="name" required defaultValue={values.name ?? ""} className={fieldClass} /><FieldError errors={errors.name} /></label>
          <label className={labelClass}>Slug *<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={values.slug ?? ""} className={fieldClass} /><FieldError errors={errors.slug} /></label>
          <label className={`${labelClass} md:col-span-2`}>Portretul autorului<InlineMediaPicker name="portraitAssetId" value={values.portraitAssetId} media={media} empty="Fără portret" /><FieldError errors={errors.portraitAssetId} /></label>
          <label className={`${labelClass} md:col-span-2`}>Biografie<textarea name="bio" rows={8} defaultValue={values.bio ?? ""} className={fieldClass} /><FieldError errors={errors.bio} /></label>
          <label className={labelClass}>Stare publică<select name="status" defaultValue={values.status ?? "draft"} className={fieldClass}><option value="draft">Ciornă</option><option value="needs_review">Necesită revizie</option><option value="published">Publicat</option><option value="archived">Arhivat</option></select></label>
        </div>
      </FormSection>
      <FormSection title="Verificare editorială" description="Aceste note rămân interne și nu sunt afișate vizitatorilor.">
        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClass}>Fapte verificate<textarea name="verifiedFacts" rows={8} defaultValue={values.verifiedFacts ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Surse și observații<textarea name="sourceNotes" rows={8} defaultValue={values.sourceNotes ?? ""} className={fieldClass} /></label>
        </div>
      </FormSection>
      <div className="flex flex-wrap items-center gap-3"><SubmitButton>{editing ? "Salvează autorul" : "Creează autorul"}</SubmitButton><Link href="/admin/authors" className="text-sm font-semibold text-muted hover:text-foreground">Renunță</Link></div>
    </form>
  );
}
