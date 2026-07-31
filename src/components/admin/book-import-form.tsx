"use client";

import { FileUp, Images, LoaderCircle } from "lucide-react";
import { useState } from "react";

import type { BookImportActionState, BookImportReportItem } from "@/domain/editorial/book-import-types";
import { initialBookImportActionState } from "@/domain/editorial/book-import-types";

import { fieldClass, labelClass } from "./editorial-ui";

type ImageResult = {
  name: string;
  identifier: string;
  status: "uploaded" | "reused" | "error";
  message: string;
};

function fileIdentifier(file: File) {
  return file.name.replace(/\.[^.]+$/, "");
}

export function BookImportForm() {
  const [catalogFile, setCatalogFile] = useState<File>();
  const [images, setImages] = useState<File[]>([]);
  const [state, setState] = useState<BookImportActionState>(initialBookImportActionState);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [busy, setBusy] = useState(false);

  async function runImport() {
    if (!catalogFile || busy) return;
    setBusy(true);
    setState(initialBookImportActionState);
    setImageResults([]);

    try {
      async function sendCatalog(mode?: "validate") {
        const body = new FormData();
        body.set("file", catalogFile as File);
        const endpoint = mode === "validate"
          ? "/api/admin/book-import?mode=validate"
          : "/api/admin/book-import";
        const response = await fetch(endpoint, { method: "POST", body });
        const result = await response.json() as BookImportActionState;
        return { response, result };
      }

      const preflight = await sendCatalog("validate");
      setState(preflight.result);
      if (!preflight.response.ok || preflight.result.status === "error" || (!preflight.result.imported.length && !preflight.result.skipped.length)) return;

      const expectedCovers = new Map((preflight.result.covers ?? []).map((cover) => [cover.identifier, cover]));
      const selectedByIdentifier = new Map<string, File>();
      const nextImageResults: ImageResult[] = [];

      for (const image of images) {
        const identifier = fileIdentifier(image);
        if (selectedByIdentifier.has(identifier)) {
          nextImageResults.push({ name: image.name, identifier, status: "error", message: "Mai există o imagine cu același identificator în selecție." });
        } else if (!expectedCovers.has(identifier)) {
          nextImageResults.push({ name: image.name, identifier, status: "error", message: "Imaginea nu este referențiată de nicio carte din fișier." });
        } else {
          selectedByIdentifier.set(identifier, image);
        }
      }

      for (const [identifier, cover] of expectedCovers) {
        const image = selectedByIdentifier.get(identifier);
        if (!image) {
          nextImageResults.push({ name: "—", identifier, status: "error", message: "Imaginea lipsește din selecție." });
        }
        void cover;
      }
      if (nextImageResults.some((item) => item.status === "error")) {
        setImageResults(nextImageResults);
        setState({ ...preflight.result, status: "error", message: "Importul nu a pornit. Corectează selecția imaginilor și încearcă din nou." });
        return;
      }

      const commit = await sendCatalog();
      setState(commit.result);
      if (!commit.response.ok || (!commit.result.imported.length && !commit.result.skipped.length)) return;

      for (const [identifier, cover] of expectedCovers) {
        const image = selectedByIdentifier.get(identifier);
        if (!image) continue;
        const uploadBody = new FormData();
        uploadBody.set("file", image);
        uploadBody.set("importKey", identifier);
        uploadBody.set("title", `Copertă ${identifier}`);
        uploadBody.set("altText", cover.altText);
        uploadBody.set("source", "Import catalog");
        try {
          const uploadResponse = await fetch("/api/admin/book-import/covers", { method: "POST", body: uploadBody });
          const payload = await uploadResponse.json() as { identifier?: string; reused?: boolean; bookId?: string | null; message?: string };
          if (!uploadResponse.ok) throw new Error(payload.message || "Încărcarea a eșuat.");
          nextImageResults.push({
            name: image.name,
            identifier,
            status: payload.reused ? "reused" : "uploaded",
            message: payload.bookId
              ? payload.reused ? "Imagine existentă, asociată cărții." : "Încărcată și asociată cărții."
              : "Imagine încărcată; asocierea nu a putut fi confirmată.",
          });
        } catch (error) {
          nextImageResults.push({ name: image.name, identifier, status: "error", message: error instanceof Error ? error.message : "Încărcarea a eșuat." });
        }
        setImageResults([...nextImageResults]);
      }
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Importul nu a putut fi pornit.", imported: [], skipped: [], errors: [] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="grid gap-5">
        <label className={labelClass}>
          Fișierul catalogului — CSV sau JSON *
          <input type="file" required accept=".csv,.json,text/csv,application/json" className={`${fieldClass} file:me-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:font-semibold file:text-brand`} onChange={(event) => setCatalogFile(event.target.files?.[0])} />
        </label>

        <label className="block rounded-xl border-2 border-dashed border-brand/30 bg-paper p-6 text-center transition hover:border-brand">
          <Images aria-hidden="true" className="mx-auto size-8 text-brand" />
          <span className="mt-3 block text-sm font-bold">Selectează toate coperțile</span>
          <span className="mt-1 block text-xs leading-5 text-muted">Numele fără extensie trebuie să fie identic cu <code>identificator_coperta</code>.</span>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(event) => setImages(Array.from(event.target.files ?? []).slice(0, 500))} />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <span>{catalogFile ? catalogFile.name : "Niciun fișier de catalog selectat"}</span>
          <span>{images.length} {images.length === 1 ? "imagine selectată" : "imagini selectate"}</span>
        </div>

        <div>
          <button type="button" disabled={!catalogFile || busy} onClick={() => void runImport()} className="inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? <LoaderCircle aria-hidden="true" className="me-2 size-4 animate-spin" /> : <FileUp aria-hidden="true" className="me-2 size-4" />}
            {busy ? "Se importă…" : "Importă cărțile, autorii și coperțile"}
          </button>
        </div>
      </div>

      {state.message ? <div role={state.status === "error" ? "alert" : "status"} className={`mt-6 rounded-xl border px-4 py-3 text-sm font-semibold ${state.status === "error" ? "border-danger/30 bg-red-50 text-danger" : "border-brand/20 bg-accent-soft text-brand"}`}>{state.message}</div> : null}
      <ImportResults title="Importate" items={state.imported} tone="success" />
      <ImportResults title="Omise" items={state.skipped} tone="neutral" />
      <ImportResults title="Erori catalog" items={state.errors} tone="error" />
      <ImageResults items={imageResults} />
    </div>
  );
}

function ImportResults({ title, items, tone }: { title: string; items: BookImportReportItem[]; tone: "success" | "neutral" | "error" }) {
  if (!items.length) return null;
  const toneClass = tone === "error" ? "text-danger" : tone === "success" ? "text-brand" : "text-muted";
  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-border">
      <h3 className={`bg-paper px-4 py-3 text-sm font-bold ${toneClass}`}>{title} ({items.length})</h3>
      <div className="max-h-72 overflow-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="border-y border-border bg-surface text-muted"><tr><th className="px-4 py-2">Rând</th><th className="px-4 py-2">Identificator</th><th className="px-4 py-2">Carte</th><th className="px-4 py-2">Rezultat</th></tr></thead><tbody className="divide-y divide-border">{items.map((item) => <tr key={`${title}-${item.row}-${item.identifier}`}><td className="px-4 py-3">{item.row}</td><td className="px-4 py-3 font-mono">{item.identifier}</td><td className="px-4 py-3 font-semibold">{item.bookId ? <a className="text-brand underline underline-offset-2" href={`/admin/books/${item.bookId}`}>{item.title}</a> : item.title}</td><td className="px-4 py-3 text-muted">{item.message}</td></tr>)}</tbody></table></div>
    </section>
  );
}

function ImageResults({ items }: { items: ImageResult[] }) {
  if (!items.length) return null;
  return <section className="mt-6 overflow-hidden rounded-xl border border-border"><h3 className="bg-paper px-4 py-3 text-sm font-bold text-brand">Coperți ({items.length})</h3><ul className="max-h-72 divide-y divide-border overflow-auto">{items.map((item, index) => <li key={`${item.identifier}-${item.name}-${index}`} className="flex items-start justify-between gap-4 px-4 py-3 text-xs"><span><strong className="block">{item.name}</strong><span className="mt-1 block font-mono text-muted">{item.identifier}</span></span><span className={item.status === "error" ? "text-danger" : "text-brand"}>{item.message}</span></li>)}</ul></section>;
}
