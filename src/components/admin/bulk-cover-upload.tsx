"use client";

import { ImageUp, LoaderCircle } from "lucide-react";
import { useState } from "react";

type UploadResult = { name: string; identifier: string; status: "uploaded" | "reused" | "error"; message: string };

export function BulkCoverUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!files.length || busy) return;
    setBusy(true);
    setResults([]);
    const nextResults: UploadResult[] = [];
    for (const file of files.slice(0, 50)) {
      const identifier = file.name.replace(/\.[^.]+$/, "");
      const body = new FormData();
      body.set("file", file);
      body.set("importKey", identifier);
      body.set("title", `Copertă ${identifier}`);
      body.set("altText", `Coperta cărții ${identifier}`);
      body.set("source", "Import bulk");
      try {
        const response = await fetch("/api/admin/book-import/covers", { method: "POST", body });
        const payload = await response.json() as { identifier?: string; reused?: boolean; bookId?: string | null; message?: string };
        if (!response.ok) throw new Error(payload.message || "Încărcarea a eșuat.");
        const association = payload.bookId ? " și asociată automat cărții" : "";
        nextResults.push({ name: file.name, identifier: payload.identifier || identifier, status: payload.reused ? "reused" : "uploaded", message: payload.reused ? `Există deja${association}.` : `Încărcată${association}.` });
      } catch (error) {
        nextResults.push({ name: file.name, identifier, status: "error", message: error instanceof Error ? error.message : "Încărcarea a eșuat." });
      }
      setResults([...nextResults]);
    }
    setBusy(false);
  }

  return (
    <div>
      <label className="block rounded-xl border-2 border-dashed border-brand/30 bg-paper p-6 text-center transition hover:border-brand">
        <ImageUp aria-hidden="true" className="mx-auto size-8 text-brand" />
        <span className="mt-3 block text-sm font-bold">Alege mai multe coperți</span>
        <span className="mt-1 block text-xs leading-5 text-muted">Numele fișierului devine identificator: <strong>carte-001.jpg</strong> → <strong>carte-001</strong>.</span>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(event) => { setFiles(Array.from(event.target.files ?? []).slice(0, 50)); setResults([]); }} />
      </label>
      {files.length ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold">{files.length} {files.length === 1 ? "imagine selectată" : "imagini selectate"}</p><button type="button" disabled={busy} onClick={() => void upload()} className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60">{busy ? <LoaderCircle aria-hidden="true" className="me-2 size-4 animate-spin" /> : null}{busy ? "Se încarcă…" : "Încarcă toate coperțile"}</button></div> : null}
      {results.length ? <ul className="mt-5 max-h-72 divide-y divide-border overflow-auto rounded-xl border border-border bg-surface">{results.map((result) => <li key={`${result.name}-${result.identifier}`} className="flex items-start justify-between gap-4 px-4 py-3 text-xs"><span><strong className="block">{result.name}</strong><span className="mt-1 block font-mono text-muted">{result.identifier}</span></span><span className={result.status === "error" ? "text-danger" : "text-brand"}>{result.message}</span></li>)}</ul> : null}
    </div>
  );
}
