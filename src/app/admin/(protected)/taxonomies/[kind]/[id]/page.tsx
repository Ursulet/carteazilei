import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TaxonomyHubForm } from "@/components/admin/taxonomy-hub-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getAdminTaxonomyHub, getSeoHubBookOptions, type AdminTaxonomyKind } from "@/db/queries/admin-seo-hubs";
import { requireSectionAccess } from "@/lib/auth/principal";

import { updateTaxonomyAction } from "../../actions";

export const metadata: Metadata = { title: "Editează taxonomia" };
const kinds = ["genre", "theme", "mood", "audience"] as const;
export default async function EditTaxonomyPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  await requireSectionAccess("taxonomies");
  const { kind, id } = await params;
  if (!kinds.includes(kind as AdminTaxonomyKind)) notFound();
  const [record, books] = await Promise.all([getAdminTaxonomyHub(kind as AdminTaxonomyKind, id), getSeoHubBookOptions()]);
  if (!record) notFound();
  return <><AdminPageHeader eyebrow="Taxonomii" title={record.name} description="Actualizează clasificarea și condițiile landing page-ului editorial." /><TaxonomyHubForm action={updateTaxonomyAction.bind(null, kind, id)} kind={kind as AdminTaxonomyKind} values={record} books={books} /></>;
}
