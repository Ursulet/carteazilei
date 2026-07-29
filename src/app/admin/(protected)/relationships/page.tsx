import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader, EmptyState } from "@/components/admin/editorial-ui";
import { getAdminRelationships } from "@/db/queries/admin-seo-hubs";
import { requireSectionAccess } from "@/lib/auth/principal";

export const metadata: Metadata = { title: "Relații între cărți" };
export default async function Page() {
  await requireSectionAccess("relationships");
  const rows = await getAdminRelationships();
  return <><AdminPageHeader eyebrow="Book intelligence" title="Relații între cărți" description="Similaritatea și continuarea sunt relații distincte. Fiecare muchie activă este aprobată și are un motiv public." action={{ href: "/admin/relationships/new", label: "Relație nouă" }} />{rows.length ? <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Sursă</th><th className="px-5 py-4">Destinație</th><th className="px-5 py-4">Tip / bază</th><th className="px-5 py-4">Forță</th><th className="px-5 py-4">Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-border/70 last:border-0"><td className="px-5 py-4"><Link href={`/admin/relationships/${row.id}`} className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand">{row.source_title}</Link></td><td className="px-5 py-4">{row.target_title}</td><td className="px-5 py-4"><span className="block">{row.type}</span>{row.next_read_basis ? <span className="text-xs text-muted">{row.next_read_basis}</span> : null}</td><td className="px-5 py-4 font-semibold">{row.strength}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${row.active ? "bg-accent-soft text-brand" : "bg-paper text-muted"}`}>{row.active ? "Activă" : "Inactivă"}</span></td></tr>)}</tbody></table></div> : <EmptyState>Nu există încă relații între cărți.</EmptyState>}</>;
}
