import type { Metadata } from "next";

import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import { getRecentAuditEntries } from "@/db/queries/admin-audit";
import { requireSectionAccess } from "@/lib/auth/principal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Jurnal de activitate" };

const actionLabels: Record<string, string> = {
  "book.create": "Carte creată",
  "book.edit": "Carte actualizată",
  "book.publish": "Carte publicată",
  "book.unpublish": "Carte retrasă",
  "book.delete": "Carte arhivată",
  "book.cover.edit": "Copertă schimbată",
  "media.create": "Imagine încărcată",
  "media.delete": "Imagine ștearsă",
  "editor.profile.create": "Profil editorial creat",
  "editor.profile.edit": "Profil editorial actualizat",
};

function detailsOf(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const details = value as Record<string, unknown>;
  const preferred = details.title ?? details.name ?? details.slug ?? details.status;
  return typeof preferred === "string" ? preferred : null;
}

export default async function AuditPage() {
  await requireSectionAccess("audit");
  const rows = await getRecentAuditEntries();

  return (
    <>
      <AdminPageHeader
        eyebrow="Trasabilitate"
        title="Jurnal de activitate"
        description="Ultimele modificări făcute în administrare, cu autorul și momentul fiecărei operațiuni."
      />
      {rows.length === 0 ? (
        <EmptyState>Jurnalul este gol. Primele modificări editoriale vor apărea aici.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-5 py-4">Data</th><th className="px-5 py-4">Operațiune</th><th className="px-5 py-4">Element</th><th className="px-5 py-4">Utilizator</th><th className="px-5 py-4">Detalii</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((entry) => {
                const summary = detailsOf(entry.diff) ?? detailsOf(entry.metadata);
                return (
                  <tr key={entry.id} className="align-top">
                    <td className="whitespace-nowrap px-5 py-4 text-muted">{new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" }).format(entry.createdAt)}</td>
                    <td className="px-5 py-4 font-semibold">{actionLabels[entry.action] ?? entry.action}</td>
                    <td className="px-5 py-4 text-muted"><span className="block">{entry.entityType}</span>{entry.entityId ? <span className="mt-1 block font-mono text-[11px]">{entry.entityId}</span> : null}</td>
                    <td className="px-5 py-4"><span className="block font-semibold">{entry.actorName ?? "Sistem"}</span>{entry.actorEmail ? <span className="mt-1 block text-xs text-muted">{entry.actorEmail}</span> : null}</td>
                    <td className="max-w-sm px-5 py-4 text-muted">{summary ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
