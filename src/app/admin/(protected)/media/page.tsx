import type { Metadata } from "next";

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
  return <><AdminPageHeader eyebrow="Bibliotecă" title="Media" description="Fișierele sunt păstrate în stocarea S3 compatibilă, iar metadatele și atribuirile rămân în catalog." /><MediaUploadForm action={uploadMediaAction} />{rows.length === 0 ? <EmptyState>Biblioteca media este goală.</EmptyState> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((asset) => <article key={asset.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-border bg-paper px-4 text-center text-xs text-muted"><span className="break-all">{asset.storageKey}</span></div><h2 className="mt-4 font-bold leading-6">{asset.altText}</h2><dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted"><div><dt className="font-bold text-foreground">Format</dt><dd>{asset.mimeType}</dd></div><div><dt className="font-bold text-foreground">Dimensiuni</dt><dd>{asset.width}×{asset.height}px</dd></div><div><dt className="font-bold text-foreground">Mărime</dt><dd>{(asset.byteSize / 1024).toFixed(0)} KB</dd></div><div><dt className="font-bold text-foreground">Sursă</dt><dd>{asset.source || "—"}</dd></div></dl>{asset.attribution ? <p className="mt-3 text-xs leading-5 text-muted">Atribuire: {asset.attribution}</p> : null}<div className="mt-5"><ConfirmDeleteForm action={deleteMediaAction.bind(null, asset.id)} message="Confirmi ștergerea fișierului din bibliotecă și din stocarea S3?" /></div></article>)}</div>}</>;
}
