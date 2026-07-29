import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader, EmptyState, StatusBadge } from "@/components/admin/editorial-ui";
import { getAdminTaxonomies } from "@/db/queries/admin-seo-hubs";
import { requireSectionAccess } from "@/lib/auth/principal";

export const metadata: Metadata = { title: "Taxonomii" };
const kindLabels = { genre: "Gen", theme: "Temă", mood: "Stare", audience: "Audiență" };
export default async function Page() {
  await requireSectionAccess("taxonomies");
  const rows = await getAdminTaxonomies();
  return <><AdminPageHeader eyebrow="Sistem editorial" title="Taxonomii și hub-uri" description="Clasifică volumele și publică numai hub-urile care au introducere, metodologie, editor, metadata unică și cel puțin cinci selecții explicate." /><div className="mb-7 flex flex-wrap gap-3">{Object.entries(kindLabels).map(([kind, label]) => <Link key={kind} href={`/admin/taxonomies/${kind}/new`} className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-bold hover:border-brand">{label} nouă</Link>)}</div>{rows.length ? <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border bg-paper text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Taxonomie</th><th className="px-5 py-4">Tip</th><th className="px-5 py-4">Cărți</th><th className="px-5 py-4">Indexare</th><th className="px-5 py-4">Status</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.kind}-${row.id}`} className="border-b border-border/70 last:border-0"><td className="px-5 py-4"><Link href={`/admin/taxonomies/${row.kind}/${row.id}`} className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand">{row.name}</Link><span className="mt-1 block text-xs text-muted">/{row.slug}</span></td><td className="px-5 py-4">{kindLabels[row.kind]}</td><td className="px-5 py-4 font-semibold">{row.bookCount}</td><td className="px-5 py-4">{row.indexable ? "Solicitată" : "Noindex"}</td><td className="px-5 py-4"><StatusBadge status={row.status} /></td></tr>)}</tbody></table></div> : <EmptyState>Nu există taxonomii.</EmptyState>}</>;
}
