import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { SeoHubPage } from "@/components/editorial/seo-hub-page";
import { getPublicEditorialListPage, listRelatedIndexableHubs } from "@/db/queries/public-seo-hubs";
import { buildMissingMetadata, buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
const getList = cache((slug: string) => getPublicEditorialListPage(slug, "list"));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getList(slug);
  if (!page) return buildMissingMetadata("Listă");
  const title = page.list.seo.title || page.list.title;
  const description = page.list.seo.description || page.list.intro || "Listă editorială Cartea Zilei.";
  const canonical = page.href;
  return buildPublicMetadata({ title, description, canonical, index: page.quality.indexable, type: "article" });
}

export default async function EditorialListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getList(slug);
  if (!page) notFound();
  const relatedHubs = await listRelatedIndexableHubs(page.selections.map((book) => book.id), page.href);
  return <SeoHubPage eyebrow="Listă editorială" title={page.list.title} intro={page.list.intro} methodology={page.list.methodology} editor={page.list.editor} updatedAt={page.list.seo.lastReviewedAt ?? page.list.updatedAt} books={page.selections} breadcrumbs={[{ label: "Acasă", href: "/" }, { label: "Liste", href: "/liste" }, { label: page.list.title }]} relatedHubs={relatedHubs} canonicalPath={page.href} />;
}
