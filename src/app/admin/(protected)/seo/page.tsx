import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getAdminEditorialLists, getAdminTaxonomies } from "@/db/queries/admin-seo-hubs";
import { requireSectionAccess } from "@/lib/auth/principal";

export const metadata: Metadata = { title: "SEO" };
export default async function Page() {
  await requireSectionAccess("seo");
  const [lists, taxonomies] = await Promise.all([getAdminEditorialLists(), getAdminTaxonomies()]);
  const requested = [...lists, ...taxonomies].filter((item) => item.indexable).length;
  const noindex = lists.length + taxonomies.length - requested;
  return <><AdminPageHeader eyebrow="Vizibilitate organică" title="Quality gate SEO" description="Indexarea este o consecință a calității editoriale, nu un simplu status. Sitemap-ul recalculează eligibilitatea din conținutul public." /><section className="grid gap-4 md:grid-cols-3"><article className="rounded-2xl border border-border bg-surface p-5"><p className="text-xs font-bold uppercase tracking-wide text-muted">Hub-uri administrate</p><p className="mt-2 text-3xl font-bold">{lists.length + taxonomies.length}</p></article><article className="rounded-2xl border border-border bg-surface p-5"><p className="text-xs font-bold uppercase tracking-wide text-muted">Indexare solicitată</p><p className="mt-2 text-3xl font-bold">{requested}</p></article><article className="rounded-2xl border border-border bg-surface p-5"><p className="text-xs font-bold uppercase tracking-wide text-muted">Noindex editorial</p><p className="mt-2 text-3xl font-bold">{noindex}</p></article></section><section className="mt-8 rounded-2xl border border-border bg-surface p-6"><h2 className="font-display text-2xl font-semibold">Criterii obligatorii</h2><ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><li className="rounded-xl bg-paper p-4">Minimum cinci cărți publice și eligibile</li><li className="rounded-xl bg-paper p-4">Motiv editorial pentru fiecare selecție</li><li className="rounded-xl bg-paper p-4">Introducere și metodologie</li><li className="rounded-xl bg-paper p-4">Editor atribuit</li><li className="rounded-xl bg-paper p-4">Titlu și descriere SEO unice</li><li className="rounded-xl bg-paper p-4">Status public și canonical propriu</li></ul><div className="mt-6 flex flex-wrap gap-3"><Link href="/admin/taxonomies" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Revizuiește taxonomiile</Link><Link href="/admin/lists" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand">Revizuiește listele</Link></div></section></>;
}
