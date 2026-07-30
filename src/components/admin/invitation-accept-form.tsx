"use client";

import { useActionState } from "react";
import { initialEditorialActionState, type EditorialActionState } from "@/domain/editorial/action-state";
import { fieldClass, labelClass } from "./editorial-ui";
import { SubmitButton } from "./submit-button";

export function InvitationAcceptForm({ action }: { action: (state: EditorialActionState, formData: FormData) => Promise<EditorialActionState> }) { const [state, formAction] = useActionState(action, initialEditorialActionState); return <form action={formAction} className="mt-6 grid gap-4">{state.status === "error" ? <p role="alert" className="rounded-xl border border-danger/30 bg-red-50 p-4 text-sm font-semibold text-danger">{state.message}</p> : null}<label className={labelClass}>Parolă nouă<input name="password" type="password" required minLength={14} maxLength={128} autoComplete="new-password" className={fieldClass} /><span className="mt-1 block text-xs font-normal text-muted">Minimum 14 caractere, cu literă mare, literă mică și cifră.</span></label><label className={labelClass}>Confirmă parola<input name="confirmation" type="password" required minLength={14} maxLength={128} autoComplete="new-password" className={fieldClass} /></label><SubmitButton>Activează contul</SubmitButton></form>; }
