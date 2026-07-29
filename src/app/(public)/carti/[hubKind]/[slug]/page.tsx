import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { SeoHubPage } from "@/components/editorial/seo-hub-page";
import {
  getPublicEditorialListPage,
  getPublicTaxonomyHub,
  listRelatedIndexableHubs,
  taxonomyHubKinds,
  type TaxonomyHubKind,
} from "@/db/queries/public-seo-hubs";
import { buildMissingMetadata, buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

const getHub = cache(async (hubKind: string, slug: string) => {
  if (hubKind === "lungime") {
    const page = await getPublicEditorialListPage(slug, "length");
    if (!page) return null;
    return {
      eyebrow: "Cărți după lungime",
      title: page.list.title,
      intro: page.list.intro,
      methodology: page.list.methodology,
      editor: page.list.editor,
      updatedAt: page.list.seo.lastReviewedAt ?? page.list.updatedAt,
      seo: page.list.seo,
      selections: page.selections,
      quality: page.quality,
      href: page.href,
    };
  }
  if (!taxonomyHubKinds.includes(hubKind as TaxonomyHubKind)) return null;
  const page = await getPublicTaxonomyHub(hubKind as TaxonomyHubKind, slug);
  if (!page) return null;
  return {
    eyebrow: page.kindLabel,
    title: page.entity.name,
    intro: page.entity.editorialIntro,
    methodology: page.entity.methodology,
    editor: page.entity.editor,
    updatedAt: page.entity.seo.lastReviewedAt ?? page.entity.updatedAt,
    seo: page.entity.seo,
    selections: page.selections,
    quality: page.quality,
    href: page.href,
  };
});

export async function generateMetadata({ params }: { params: Promise<{ hubKind: string; slug: string }> }): Promise<Metadata> {
  const { hubKind, slug } = await params;
  const hub = await getHub(hubKind, slug);
  if (!hub) return buildMissingMetadata("Selecție");
  const title = hub.seo.title || hub.title;
  const description = hub.seo.description || hub.intro || "Selecție editorială Cartea Zilei.";
  const canonical = hub.href;
  return buildPublicMetadata({ title, description, canonical, index: hub.quality.indexable });
}

export default async function TaxonomyHubPage({ params }: { params: Promise<{ hubKind: string; slug: string }> }) {
  const { hubKind, slug } = await params;
  const hub = await getHub(hubKind, slug);
  if (!hub || !hub.intro || !hub.methodology) notFound();
  const relatedHubs = await listRelatedIndexableHubs(hub.selections.map((book) => book.id), hub.href);
  return (
    <SeoHubPage
      eyebrow={hub.eyebrow}
      title={hub.title}
      intro={hub.intro}
      methodology={hub.methodology}
      editor={hub.editor}
      updatedAt={hub.updatedAt}
      books={hub.selections}
      breadcrumbs={[{ label: "Acasă", href: "/" }, { label: "Cărți", href: "/carti" }, { label: hub.title }]}
      relatedHubs={relatedHubs}
      canonicalPath={hub.href}
    />
  );
}
