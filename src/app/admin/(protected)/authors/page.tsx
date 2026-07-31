import type { Metadata } from "next";
import Link from "next/link";

import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import { AdminPageHeader, EmptyState, StatusBadge } from "@/components/admin/editorial-ui";
import { getAdminAuthors } from "@/domain/editorial/author-service";
import { requireSectionAccess } from "@/lib/auth/principal";

import { deleteAuthorAction } from "./actions";

export const metadata: Metadata = { title: "Autori" };

export default async function AuthorsPage() {
  await requireSectionAccess("authors");
  const rows = await getAdminAuthors();
  return <><AdminPageHeader eyebrow="Catalog" title="Autori" description="Profiluri publice, fapte verificate și note de sursă păstrate separat." action={{ href: "/admin/authors/new", label: "Autor nou" }} /><div className="mb-6 flex justify-end"><Link href="/admin/authors/import" className="inline-flex min-h-11 items-center rounded-full border border-brand px-5 text-sm font-bold text-brand hover:bg-accent-soft">Importă din fișier</Link></div>{rows.length === 0 ? <EmptyState>Nu există încă autori.</EmptyState> : <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Autor</th><th className="px-5 py-4">Identificator import</th><th className="px-5 py-4">Slug</th><th className="px-5 py-4">Stare</th><th className="px-5 py-4">Actualizat</th><th className="px-5 py-4"><span className="sr-only">Acțiuni</span></th></tr></thead><tbody>{rows.map((author) => <tr key={author.id} className="border-b border-border/70 last:border-0"><td className="px-5 py-4"><Link href={`/admin/authors/${author.id}`} className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand">{author.name}</Link></td><td className="px-5 py-4 font-mono text-xs text-muted">{author.importKey ?? "—"}</td><td className="px-5 py-4 text-muted">{author.slug}</td><td className="px-5 py-4"><StatusBadge status={author.status} /></td><td className="px-5 py-4 text-muted">{new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" }).format(author.updatedAt)}</td><td className="px-5 py-4"><ConfirmDeleteForm action={deleteAuthorAction.bind(null, author.id)} /></td></tr>)}</tbody></table></div>}</>;
}
