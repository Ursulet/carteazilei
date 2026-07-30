import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { getAdminMedia } from "@/db/queries/admin-media";
import { requireSectionAccess } from "@/lib/auth/principal";

import { uploadMediaAction } from "./actions";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireSectionAccess("media");
  const filters = await searchParams;
  const rows = await getAdminMedia(filters);

  return (
    <>
      <AdminPageHeader
        eyebrow="Bibliotecă"
        title="Imagini"
        description="Încarcă și reutilizează coperți, portrete și logo-uri. Fișierele sunt păstrate în storage-ul configurat, iar descrierile lor rămân în catalog."
      />
      <MediaUploadForm action={uploadMediaAction} />
      <form className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-border bg-surface p-4"><input name="q" type="search" defaultValue={filters.q ?? ""} placeholder="Caută titlu sau text alternativ…" className="min-w-64 flex-1 rounded-xl border border-border bg-paper px-4 py-2.5 text-sm" /><select name="status" defaultValue={filters.status ?? ""} className="rounded-xl border border-border bg-paper px-3 py-2.5 text-sm"><option value="">Toate</option><option value="active">Active</option><option value="archived">Arhivate</option></select><button className="rounded-full bg-brand px-5 text-sm font-semibold text-white">Filtrează</button></form>
      {rows.length === 0 ? (
        <EmptyState>Nu ai încă imagini. Încarcă prima copertă folosind formularul de mai sus.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((asset) => (
            <article key={asset.id} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="relative aspect-[4/3] bg-paper">
                <Image
                  src={`/media/${asset.id}`}
                  alt={asset.altText}
                  fill
                  unoptimized
                  sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                  className="object-contain p-4"
                />
              </div>
              <div className="p-5">
                <h2 className="font-bold leading-6">{asset.title || asset.altText}</h2>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{asset.altText}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                  <div><dt className="font-bold text-foreground">Format</dt><dd>{asset.mimeType}</dd></div>
                  <div><dt className="font-bold text-foreground">Dimensiuni</dt><dd>{asset.width}×{asset.height}px</dd></div>
                  <div><dt className="font-bold text-foreground">Mărime</dt><dd>{(asset.byteSize / 1024).toFixed(0)} KB</dd></div>
                  <div><dt className="font-bold text-foreground">Sursă</dt><dd>{asset.source || "—"}</dd></div>
                </dl>
                {asset.attribution ? <p className="mt-3 text-xs leading-5 text-muted">Atribuire: {asset.attribution}</p> : null}
                <div className="mt-5"><Link href={`/admin/media/${asset.id}`} className="text-sm font-semibold text-brand underline underline-offset-4">Detalii și utilizări</Link></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
