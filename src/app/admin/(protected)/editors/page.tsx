import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import { getAdminInternalUsers } from "@/domain/editorial/editor-profile-service";
import { roleLabels, type RoleCode } from "@/lib/auth/access";
import { requireSectionAccess } from "@/lib/auth/principal";

import { createEditorProfileAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Utilizatori și editori" };

export default async function EditorsPage() {
  await requireSectionAccess("editors");
  const rows = await getAdminInternalUsers();

  return (
    <>
      <AdminPageHeader
        eyebrow="Echipă"
        title="Utilizatori și editori"
        description="Vezi conturile cu acces intern și creează pentru ele profilul editorial folosit la articole, recomandări și paginile publice ale echipei."
      />
      {rows.length === 0 ? (
        <EmptyState>Nu există utilizatori interni.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-5 py-4">Utilizator</th><th className="px-5 py-4">Roluri</th><th className="px-5 py-4">Cont</th><th className="px-5 py-4">Profil editorial</th><th className="px-5 py-4"><span className="sr-only">Acțiuni</span></th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((account) => (
                <tr key={account.userId}>
                  <td className="px-5 py-4"><span className="block font-bold">{account.name}</span><span className="mt-1 block text-xs text-muted">{account.email}</span></td>
                  <td className="px-5 py-4 text-muted">{account.roles.map((role) => roleLabels[role as RoleCode] ?? role).join(", ") || "—"}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${account.active ? "bg-accent-soft text-brand" : "bg-paper text-muted"}`}>{account.active ? "Activ" : "Inactiv"}</span></td>
                  <td className="px-5 py-4">{account.editorId ? <><span className="block font-semibold">{account.displayName}</span><span className="mt-1 block text-xs text-muted">{account.publicProfile ? "Public" : "Ascuns"} · /{account.slug}</span></> : <span className="text-muted">Nu este creat</span>}</td>
                  <td className="px-5 py-4 text-right">
                    {account.editorId ? (
                      <Link href={`/admin/editors/${account.editorId}`} className="font-semibold text-brand underline underline-offset-4">Editează profilul</Link>
                    ) : account.active ? (
                      <form action={createEditorProfileAction.bind(null, account.userId)}><button type="submit" className="min-h-10 rounded-full border border-border px-4 text-sm font-semibold hover:border-brand">Creează profil</button></form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
