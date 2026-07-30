"use client";

import { useActionState } from "react";

import type { EditorialActionState } from "@/domain/editorial/action-state";
import { initialEditorialActionState } from "@/domain/editorial/action-state";
import type { RecommendationConfiguration } from "@/domain/recommendation/configuration-model";

import { FieldError, fieldClass, labelClass } from "./editorial-ui";
import { SubmitButton } from "./submit-button";

const fields: Array<{ key: keyof RecommendationConfiguration; label: string; note: string }> = [
  { key: "needWeight", label: "Nevoia cititorului", note: "Efectul principal căutat." },
  { key: "genreWeight", label: "Gen", note: "Genurile selectate în chestionar." },
  { key: "paceWeight", label: "Ritm", note: "Potrivirea cu ritmul dorit." },
  { key: "lengthWeight", label: "Lungime", note: "Intervalul de pagini preferat." },
  { key: "referenceWeight", label: "Carte de referință", note: "Relația cu titlul apreciat." },
  { key: "editorialConfidenceWeight", label: "Încredere editorială", note: "Calitatea evaluării interne." },
  { key: "freshnessWeight", label: "Actualitate", note: "Cât de recent a fost revizuită cartea." },
];

export function RecommendationSettingsForm({ action, values }: { action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState>; values: RecommendationConfiguration }) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  const errors = state.fieldErrors ?? {};
  return <form action={formAction} className="mt-5 grid gap-5">
    {state.message ? <p role={state.status === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${state.status === "error" ? "border-danger/30 bg-red-50 text-danger" : "border-brand/20 bg-accent-soft text-brand"}`}>{state.message}</p> : null}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <label className={labelClass}>Scor minim<input name="minimumScore" type="number" min="0" max="100" required defaultValue={values.minimumScore} className={fieldClass} /><span className="mt-1 block text-xs font-normal text-muted">Sub acest prag nu este afișat rezultatul.</span><FieldError errors={errors.minimumScore} /></label>
      {fields.map((field) => <label key={field.key} className={labelClass}>{field.label}<input name={field.key} type="number" min="0" max="100" required defaultValue={values[field.key]} className={fieldClass} /><span className="mt-1 block text-xs font-normal text-muted">{field.note}</span><FieldError errors={errors[field.key]} /></label>)}
    </div>
    <div className="flex items-center gap-4"><SubmitButton>Salvează configurația</SubmitButton><span className="text-xs text-muted">Revizia curentă: {values.revision}</span></div>
  </form>;
}
