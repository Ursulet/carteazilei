import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import { getAdminEditorProfiles } from "@/domain/editorial/editor-profile-service";
import { requireSectionAccess } from "@/lib/auth/principal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Utilizatori și editori" };

export default async function EditorsPage() {
  await requireSectionAccess("editors");
  const rows = await getAdminEditorProfiles();
  return <><AdminPageHeader eyebrow="Acces intern" title="Utilizatori și editori" description="Rolurile provin din sistemul de acces; aici administrezi numai identitatea editorială afișată public." />{rows.length ? <div className="overflow-x-auto rounded-2xl border border-border bg-surface"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Editor</th><th className="px-5 py-4">Cont intern</th><th className="px-5 py-4">Roluri</th><th className="px-5 py-4">Profil public</th><th className="px-5 py-4">Actualizat</th></tr></thead><tbody>{rows.map((editor) => <tr key={editor.id} className="border-b border-border last:border-0"><td className="px-5 py-4"><Link href={`/admin/editors/${editor.id}`} className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand">{editor.displayName}</Link><span className="mt-1 block text-xs text-muted">/{editor.slug}</span></td><td className="px-5 py-4 text-muted">{editor.email}</td><td className="px-5 py-4 text-muted">{editor.roles.join(", ") || "—"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${editor.publicProfile ? "bg-accent-soft text-brand" : "bg-paper text-muted"}`}>{editor.publicProfile ? "Public" : "Ascuns"}</span></td><td className="px-5 py-4 text-muted">{new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium" }).format(editor.updatedAt)}</td></tr>)}</tbody></table></div> : <EmptyState>Nu există încă profile editoriale asociate utilizatorilor interni.</EmptyState>}</>;
}
