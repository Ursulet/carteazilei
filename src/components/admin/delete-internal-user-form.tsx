"use client";

import { useActionState } from "react";

import { initialEditorialActionState, type EditorialActionState } from "@/domain/editorial/action-state";
import { SubmitButton } from "./submit-button";

export function DeleteInternalUserForm({ action }: { action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState> }) {
  const [state, formAction] = useActionState(action, initialEditorialActionState);
  return <form action={formAction} className="mt-8 rounded-2xl border border-danger/25 bg-red-50 p-5"><h2 className="font-display text-2xl font-semibold">Arhivează contul</h2><p className="mt-2 text-sm leading-6 text-muted">Contul va fi dezactivat, sesiunile revocate, iar profilul public va fi ascuns. Istoricul editorial și auditul rămân păstrate.</p>{state.status === "error" ? <p role="alert" className="mt-4 text-sm font-semibold text-danger">{state.message}</p> : null}<div className="mt-5"><SubmitButton variant="danger">Arhivează utilizatorul</SubmitButton></div></form>;
}
