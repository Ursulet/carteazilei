import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { RelationshipLanding } from "@/components/editorial/relationship-landing";
import { getPublicRelationshipLanding, listRelatedIndexableHubs } from "@/db/queries/public-seo-hubs";
import { buildMissingMetadata, buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
const getPage = cache((slug: string) => getPublicRelationshipLanding(slug, "next_read"));

export async function generateMetadata({ params }: { params: Promise<{ bookSlug: string }> }): Promise<Metadata> {
  const { bookSlug } = await params;
  const page = await getPage(bookSlug);
  if (!page) return buildMissingMetadata("Carte");
  const title = `Ce să citești după ${page.source.book.title}`;
  const description = `Continuări editoriale după ${page.source.book.title}, separate după temă, ritm, stil, lume și efect emoțional.`;
  return buildPublicMetadata({ title, description, canonical: page.href, index: page.quality.indexable, type: "article" });
}

export default async function NextReadPage({ params }: { params: Promise<{ bookSlug: string }> }) {
  const { bookSlug } = await params;
  const page = await getPage(bookSlug);
  if (!page || !page.relationships.length) notFound();
  const relatedHubs = await listRelatedIndexableHubs([page.source.book.id, ...page.relationships.map((relationship) => relationship.target.id)], page.href);
  return <RelationshipLanding page={page} relatedHubs={relatedHubs} />;
}
