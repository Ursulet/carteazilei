import type { Metadata } from "next";

import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import { getAuditEntries } from "@/db/queries/admin-audit";
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
  "auth.sign_in": "Autentificare reușită",
  "auth.sign_in_failed": "Autentificare eșuată",
  "user.invite": "Utilizator invitat",
  "user.edit": "Utilizator actualizat",
  "user.archive": "Utilizator arhivat",
  "user.sessions_revoke": "Sesiuni revocate",
  "user.force_password_reset": "Resetare parolă impusă",
  "role.create": "Rol creat",
  "role.edit": "Rol și permisiuni actualizate",
  "role.delete": "Rol arhivat",
  "site_settings.edit": "Setări globale actualizate",
  "contact_message.create": "Mesaj de contact primit",
  "contact_message.update": "Mesaj de contact procesat",
  "contact_message.reply": "Răspuns trimis",
  "navigation.edit": "Navigație actualizată",
  "page.edit": "Pagină actualizată",
};

function detailsOf(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const details = value as Record<string, unknown>;
  const preferred = details.title ?? details.name ?? details.slug ?? details.status;
  return typeof preferred === "string" ? preferred : null;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string; action?: string; outcome?: string }> }) {
  await requireSectionAccess("audit");
  const filters = await searchParams;
  const rows = await getAuditEntries(filters);

  return (
    <>
      <AdminPageHeader
        eyebrow="Trasabilitate"
        title="Jurnal de activitate"
        description="Ultimele modificări făcute în administrare, cu autorul și momentul fiecărei operațiuni."
      />
      <form className="mb-6 grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_180px_auto]">
        <label className="text-sm font-semibold">Caută<input name="q" defaultValue={filters.q ?? ""} placeholder="Utilizator, email, entitate" className="mt-2 w-full rounded-xl border border-border bg-paper px-3 py-2 font-normal" /></label>
        <label className="text-sm font-semibold">Acțiune<input name="action" defaultValue={filters.action ?? ""} placeholder="ex. user, book, media" className="mt-2 w-full rounded-xl border border-border bg-paper px-3 py-2 font-normal" /></label>
        <label className="text-sm font-semibold">Rezultat<select name="outcome" defaultValue={filters.outcome ?? ""} className="mt-2 w-full rounded-xl border border-border bg-paper px-3 py-2 font-normal"><option value="">Toate</option><option value="success">Succes</option><option value="failure">Eșec</option></select></label>
        <button className="self-end rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">Filtrează</button>
      </form>
      {rows.length === 0 ? (
        <EmptyState>Jurnalul este gol. Primele modificări editoriale vor apărea aici.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-5 py-4">Data</th><th className="px-5 py-4">Operațiune</th><th className="px-5 py-4">Rezultat</th><th className="px-5 py-4">Element</th><th className="px-5 py-4">Utilizator</th><th className="px-5 py-4">Detalii</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((entry) => {
                const summary = detailsOf(entry.diff) ?? detailsOf(entry.metadata);
                return (
                  <tr key={entry.id} className="align-top">
                    <td className="whitespace-nowrap px-5 py-4 text-muted">{new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" }).format(entry.createdAt)}</td>
                    <td className="px-5 py-4 font-semibold">{actionLabels[entry.action] ?? entry.action}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${entry.outcome === "failure" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>{entry.outcome === "failure" ? "Eșec" : "Succes"}</span></td>
                    <td className="px-5 py-4 text-muted"><span className="block">{entry.entityType}</span>{entry.entityId ? <span className="mt-1 block font-mono text-[11px]">{entry.entityId}</span> : null}</td>
                    <td className="px-5 py-4"><span className="block font-semibold">{entry.actorName ?? "Sistem"}</span>{entry.actorEmail ? <span className="mt-1 block text-xs text-muted">{entry.actorEmail}</span> : null}</td>
                    <td className="max-w-sm px-5 py-4 text-muted"><span className="block">{summary ?? "—"}</span>{entry.userAgent ? <span className="mt-1 block max-w-xs truncate text-[11px]" title={entry.userAgent}>{entry.userAgent}</span> : null}{entry.ipHash ? <span className="mt-1 block font-mono text-[10px]">IP hash: {entry.ipHash.slice(0, 12)}…</span> : null}</td>
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
