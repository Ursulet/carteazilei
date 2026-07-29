import type { Metadata } from "next";
import Image from "next/image";

import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { getAdminMedia } from "@/domain/editorial/media-service";
import { requireSectionAccess } from "@/lib/auth/principal";

import { deleteMediaAction, uploadMediaAction } from "./actions";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage() {
  await requireSectionAccess("media");
  const rows = await getAdminMedia();

  return (
    <>
      <AdminPageHeader
        eyebrow="Bibliotecă"
        title="Imagini"
        description="Încarcă și reutilizează coperți, portrete și logo-uri. Fișierele sunt păstrate în storage-ul configurat, iar descrierile lor rămân în catalog."
      />
      <MediaUploadForm action={uploadMediaAction} />
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
                <h2 className="font-bold leading-6">{asset.altText}</h2>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                  <div><dt className="font-bold text-foreground">Format</dt><dd>{asset.mimeType}</dd></div>
                  <div><dt className="font-bold text-foreground">Dimensiuni</dt><dd>{asset.width}×{asset.height}px</dd></div>
                  <div><dt className="font-bold text-foreground">Mărime</dt><dd>{(asset.byteSize / 1024).toFixed(0)} KB</dd></div>
                  <div><dt className="font-bold text-foreground">Sursă</dt><dd>{asset.source || "—"}</dd></div>
                </dl>
                {asset.attribution ? <p className="mt-3 text-xs leading-5 text-muted">Atribuire: {asset.attribution}</p> : null}
                <div className="mt-5">
                  <ConfirmDeleteForm
                    action={deleteMediaAction.bind(null, asset.id)}
                    message="Confirmi ștergerea imaginii din bibliotecă și din storage?"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
