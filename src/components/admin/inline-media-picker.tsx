"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Media = { id: string; altText: string };

export function InlineMediaPicker({
  name,
  value,
  media,
  empty = "Fără imagine",
}: {
  name: string;
  value: string | null | undefined;
  media: Media[];
  empty?: string;
}) {
  const [items, setItems] = useState(media);
  const [selected, setSelected] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const altTextRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  async function upload() {
    const file = fileRef.current?.files?.[0];
    const altText = altTextRef.current?.value.trim() ?? "";
    const title = titleRef.current?.value.trim() ?? "";
    if (!file) {
      setError("Alege o imagine.");
      return;
    }
    if (altText.length < 5) {
      setError("Descrierea alternativă trebuie să aibă cel puțin 5 caractere.");
      return;
    }

    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("altText", altText);
    if (title) formData.set("title", title);

    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: formData });
      const body = await response.json() as { ok?: boolean; asset?: Media; message?: string };
      if (!response.ok || !body.ok || !body.asset) throw new Error(body.message || "Încărcarea a eșuat.");
      setItems((current) => [body.asset!, ...current.filter((asset) => asset.id !== body.asset!.id)]);
      setSelected(body.asset.id);
      setOpen(false);
      if (fileRef.current) fileRef.current.value = "";
      if (altTextRef.current) altTextRef.current.value = "";
      if (titleRef.current) titleRef.current.value = "";
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Încărcarea a eșuat.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <select name={name} value={selected} onChange={(event) => setSelected(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm shadow-sm">
          <option value="">{empty}</option>
          {items.map((asset) => <option key={asset.id} value={asset.id}>{asset.altText}</option>)}
        </select>
        <button type="button" onClick={() => { setOpen((current) => !current); setError(null); }} className="shrink-0 rounded-xl border border-border px-3 text-xs font-semibold hover:border-brand">
          Încarcă
        </button>
      </div>
      {selected ? <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-paper p-3"><Image src={`/media/${selected}`} alt="Previzualizarea imaginii selectate" width={64} height={80} unoptimized className="h-20 w-16 rounded-lg object-cover" /><span className="text-xs text-muted">Imagine selectată și pregătită pentru salvarea formularului.</span></div> : null}
      {open ? (
        <div className="mt-3 grid gap-3 rounded-xl border border-border bg-paper p-4">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="text-xs" />
          <input ref={altTextRef} minLength={5} maxLength={500} placeholder="Descriere alternativă" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          <input ref={titleRef} maxLength={200} placeholder="Titlu intern (opțional)" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          {error ? <p aria-live="polite" className="text-xs font-semibold text-danger">{error}</p> : null}
          <button type="button" onClick={upload} disabled={pending} className="justify-self-start rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
            {pending ? "Se încarcă…" : "Încarcă și selectează"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
