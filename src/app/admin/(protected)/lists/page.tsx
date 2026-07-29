import type { Metadata } from "next";
import Link from "next/link";

import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import { AdminPageHeader, EmptyState, StatusBadge } from "@/components/admin/editorial-ui";
import { getAdminEditorialLists } from "@/db/queries/admin-seo-hubs";
import { requireSectionAccess } from "@/lib/auth/principal";

import { deleteEditorialListAction } from "./actions";

export const metadata: Metadata = { title: "Liste editoriale" };
export default async function Page() {
  await requireSectionAccess("lists");
  const lists = await getAdminEditorialLists();
  return <><AdminPageHeader eyebrow="Conținut" title="Liste editoriale" description="Construiește liste și hub-uri de lungime cu metodologie, metadata unică și motiv pentru fiecare selecție." action={{ href: "/admin/lists/new", label: "Listă nouă" }} />{lists.length ? <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Listă</th><th className="px-5 py-4">Tip</th><th className="px-5 py-4">Cărți</th><th className="px-5 py-4">Indexare</th><th className="px-5 py-4">Status</th><th className="px-5 py-4"><span className="sr-only">Acțiuni</span></th></tr></thead><tbody>{lists.map((list) => <tr key={list.id} className="border-b border-border/70 last:border-0"><td className="px-5 py-4"><Link href={`/admin/lists/${list.id}`} className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand">{list.title}</Link><span className="mt-1 block text-xs text-muted">/{list.slug}</span></td><td className="px-5 py-4">{list.type}</td><td className="px-5 py-4 font-semibold">{list.bookCount}</td><td className="px-5 py-4">{list.indexable ? "Solicitată" : "Noindex"}</td><td className="px-5 py-4"><StatusBadge status={list.status} /></td><td className="px-5 py-4"><ConfirmDeleteForm action={deleteEditorialListAction.bind(null, list.id)} message="Confirmi arhivarea și eliminarea listei?" /></td></tr>)}</tbody></table></div> : <EmptyState>Nu există încă liste editoriale.</EmptyState>}</>;
}
