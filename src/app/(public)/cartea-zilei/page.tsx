import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

import { DailyFeatureArticle } from "@/components/editorial/daily-feature-article";
import { PublicEmptyState } from "@/components/editorial/public-empty-state";
import { PublicPageHeader } from "@/components/editorial/public-page-header";
import { getCurrentPublicDailyFeature } from "@/db/queries/public-daily-features";
import { formatEditorialDate } from "@/domain/editorial/bucharest-date";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
const getCurrent = cache(getCurrentPublicDailyFeature);

export async function generateMetadata(): Promise<Metadata> {
  const { date, feature } = await getCurrent();
  if (!feature) return buildPublicMetadata({
    title: "Cartea Zilei",
    description: "Selecția editorială curentă și arhiva recomandărilor Cartea Zilei.",
    canonical: "/cartea-zilei",
    index: false,
  });
  return buildPublicMetadata({
    title: `${feature.book.title} — Cartea Zilei`,
    description: feature.book.verdict?.slice(0, 160) ?? `Selecția editorială din ${formatEditorialDate(date)}.`,
    canonical: `/cartea-zilei/${date}`,
    type: "article",
    image: feature.cover.id ? `/media/${feature.cover.id}` : "/og.png",
    imageAlt: feature.cover.altText ?? `Coperta cărții ${feature.book.title}`,
  });
}

export default async function CurrentDailyFeaturePage() {
  const { date, feature } = await getCurrent();
  if (feature) return <DailyFeatureArticle feature={feature} currentEntry />;
  console.warn(`[editorial] Ruta /cartea-zilei nu are o selecție publică și completă pentru ${date}.`);
  return (
    <div>
      <PublicPageHeader eyebrow="Cartea Zilei" title="Descoperă o recomandare publicată" description="Răsfoiește alegerile editorilor sau găsește o carte potrivită gusturilor tale." currentLabel="Cartea Zilei" currentPath="/cartea-zilei" />
      <section className="py-16 md:py-24"><div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8"><PublicEmptyState title="Cu ce vrei să începi?" description="Poți explora recomandările anterioare sau poți cere o alegere personalizată."><Link href="/cartea-zilei/arhiva" className="inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover">Vezi recomandările</Link><Link href="/recomanda-mi" className="inline-flex min-h-11 items-center rounded-full border border-border px-6 text-sm font-bold hover:border-brand">Recomandă-mi o carte</Link></PublicEmptyState></div></section>
    </div>
  );
}
