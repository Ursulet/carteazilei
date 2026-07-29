"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children = "Salvează" }: { children?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60">{pending ? "Se salvează…" : children}</button>;
}

export function UploadButton({ children = "Încarcă imaginea" }: { children?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60">{pending ? "Se încarcă…" : children}</button>;
}
