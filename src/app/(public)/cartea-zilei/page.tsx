import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

import { Breadcrumbs } from "@/components/editorial/breadcrumbs";
import { DailyFeatureArticle } from "@/components/editorial/daily-feature-article";
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
    <section className="py-16 md:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Acasă", href: "/" }, { label: "Cartea Zilei" }]} currentPath="/cartea-zilei" />
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Selecția din {formatEditorialDate(date)}</p>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.03em]">Alegerea de astăzi este în pregătire.</h1>
        <p className="mt-6 text-lg leading-8 text-muted">Nu publicăm automat o carte aleatorie atunci când programarea editorială lipsește. Arhiva păstrează toate alegerile publicate și datate.</p>
        <Link href="/cartea-zilei/arhiva" className="mt-8 inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover">Vezi arhiva</Link>
      </div>
    </section>
  );
}
