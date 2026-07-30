import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import { getAssignableRoles } from "@/domain/auth/internal-user-service";
import { getAdminInternalUsers } from "@/domain/editorial/editor-profile-service";
import { requireSectionAccess } from "@/lib/auth/principal";
import { createEditorProfileAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Utilizatori" };
const statusLabels: Record<string, string> = { invited: "Invitat", active: "Activ", suspended: "Suspendat", disabled: "Dezactivat", archived: "Arhivat" };

export default async function EditorsPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; status?: string }> }) {
  const principal = await requireSectionAccess("editors");
  const [allRows, availableRoles, query] = await Promise.all([getAdminInternalUsers(), getAssignableRoles(), searchParams]);
  const q = query.q?.trim().toLocaleLowerCase("ro") ?? "";
  const rows = allRows.filter((account) => (!q || `${account.name} ${account.email}`.toLocaleLowerCase("ro").includes(q)) && (!query.role || account.roles.includes(query.role)) && (!query.status || account.status === query.status));
  return <>
    <AdminPageHeader eyebrow="Utilizatori și acces" title="Utilizatori" description="Caută, filtrează, invită și administrează conturile, rolurile, statusurile și sesiunile echipei." action={{ href: "/admin/editors/new", label: "Utilizator nou" }} />
    <form className="mb-6 grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-[minmax(0,1fr)_14rem_14rem_auto]">
      <input name="q" type="search" defaultValue={query.q ?? ""} placeholder="Caută nume sau email…" className="rounded-xl border border-border bg-paper px-4 py-2.5 text-sm" />
      <select name="role" defaultValue={query.role ?? ""} className="rounded-xl border border-border bg-paper px-3 py-2.5 text-sm"><option value="">Toate rolurile</option>{availableRoles.map((role) => <option key={role.id} value={role.code}>{role.name}</option>)}</select>
      <select name="status" defaultValue={query.status ?? ""} className="rounded-xl border border-border bg-paper px-3 py-2.5 text-sm"><option value="">Toate statusurile</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <button className="min-h-11 rounded-full bg-brand px-5 text-sm font-semibold text-white">Filtrează</button>
    </form>
    {rows.length === 0 ? <EmptyState>Nu există utilizatori pentru filtrele selectate.</EmptyState> : <div className="overflow-x-auto rounded-2xl border border-border bg-surface"><table className="w-full min-w-[1150px] text-left text-sm"><thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Utilizator</th><th className="px-5 py-4">Roluri</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Activitate</th><th className="px-5 py-4">Profil editorial</th><th className="px-5 py-4">Acțiuni</th></tr></thead><tbody className="divide-y divide-border">{rows.map((account) => <tr key={account.userId}><td className="px-5 py-4"><span className="block font-bold">{account.name}</span><span className="mt-1 block text-xs text-muted">{account.email}</span>{account.phone ? <span className="mt-1 block text-xs text-muted">{account.phone}</span> : null}</td><td className="px-5 py-4 text-muted">{account.roleNames.join(", ") || "—"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${account.status === "active" ? "bg-accent-soft text-brand" : account.status === "suspended" ? "bg-amber-50 text-amber-800" : "bg-paper text-muted"}`}>{statusLabels[account.status] ?? account.status}</span></td><td className="px-5 py-4 text-xs text-muted"><span className="block">Ultima: {account.lastLoginAt ? new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" }).format(account.lastLoginAt) : "niciodată"}</span><span className="mt-1 block">Creat: {new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium" }).format(account.createdAt)}</span></td><td className="px-5 py-4">{account.editorId ? <><span className="block font-semibold">{account.displayName}</span><span className="mt-1 block text-xs text-muted">{account.publicProfile ? "Public" : "Ascuns"} · /{account.slug}</span></> : <span className="text-muted">Nu este creat</span>}</td><td className="px-5 py-4"><div className="flex flex-wrap justify-end gap-3"><Link href={account.userId === principal.id ? "/admin/account" : `/admin/editors/cont/${account.userId}`} className="font-semibold text-brand underline underline-offset-4">Editează</Link>{account.editorId ? <Link href={`/admin/editors/${account.editorId}`} className="font-semibold text-brand underline underline-offset-4">Profil public</Link> : account.status === "active" ? <form action={createEditorProfileAction.bind(null, account.userId)}><button type="submit" className="font-semibold text-brand underline underline-offset-4">Creează profil</button></form> : null}</div></td></tr>)}</tbody></table></div>}
  </>;
}
