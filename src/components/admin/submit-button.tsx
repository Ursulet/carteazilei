"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children = "Salvează", variant = "primary" }: { children?: string; variant?: "primary" | "danger" }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={`inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-bold text-white transition disabled:cursor-wait disabled:opacity-60 ${variant === "danger" ? "bg-danger hover:bg-red-800" : "bg-brand hover:bg-brand-hover"}`}>{pending ? "Se salvează…" : children}</button>;
}

export function UploadButton({ children = "Încarcă imaginea" }: { children?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60">{pending ? "Se încarcă…" : children}</button>;
}
