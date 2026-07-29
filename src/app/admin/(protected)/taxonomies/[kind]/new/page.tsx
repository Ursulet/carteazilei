import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TaxonomyHubForm } from "@/components/admin/taxonomy-hub-form";
import { AdminPageHeader } from "@/components/admin/editorial-ui";
import { getSeoHubBookOptions, type AdminTaxonomyKind } from "@/db/queries/admin-seo-hubs";
import { requireSectionAccess } from "@/lib/auth/principal";

import { createTaxonomyAction } from "../../actions";

export const metadata: Metadata = { title: "Taxonomie nouă" };
const kinds = ["genre", "theme", "mood", "audience"] as const;
export default async function NewTaxonomyPage({ params }: { params: Promise<{ kind: string }> }) {
  await requireSectionAccess("taxonomies");
  const { kind } = await params;
  if (!kinds.includes(kind as AdminTaxonomyKind)) notFound();
  const books = await getSeoHubBookOptions();
  return <><AdminPageHeader eyebrow="Taxonomii" title="Taxonomie nouă" description="Poate rămâne o clasificare internă sau poate deveni hub public după quality gate." /><TaxonomyHubForm action={createTaxonomyAction.bind(null, kind)} kind={kind as AdminTaxonomyKind} books={books} /></>;
}
