import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { DailyFeatureArticle } from "@/components/editorial/daily-feature-article";
import { getPublicDailyFeatureByDate } from "@/db/queries/public-daily-features";
import { assertEditorialDate, formatEditorialDate } from "@/domain/editorial/bucharest-date";
import { buildMissingMetadata, buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
const getFeature = cache(getPublicDailyFeatureByDate);

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  if (!assertEditorialDate(date)) return buildMissingMetadata("Selecție");
  const feature = await getFeature(date);
  if (!feature) return buildMissingMetadata("Selecție");
  return buildPublicMetadata({
    title: `${feature.book.title} — Cartea Zilei din ${formatEditorialDate(date)}`,
    description: (feature.book.verdict ?? feature.whyToday ?? `Selecția editorială din ${formatEditorialDate(date)}.`).slice(0, 160),
    canonical: `/cartea-zilei/${date}`,
    type: "article",
    image: feature.cover.id ? `/media/${feature.cover.id}` : "/og.png",
    imageAlt: feature.cover.altText ?? `Coperta cărții ${feature.book.title}`,
  });
}

export default async function DatedDailyFeaturePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!assertEditorialDate(date)) notFound();
  const feature = await getFeature(date);
  if (!feature) notFound();
  return <DailyFeatureArticle feature={feature} />;
}
