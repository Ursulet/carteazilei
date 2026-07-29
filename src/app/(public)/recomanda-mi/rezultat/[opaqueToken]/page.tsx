import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RecommendationResult } from "@/components/recommendation/recommendation-result";
import { getPublicRecommendationResult } from "@/domain/recommendation/result-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recomandarea ta de lectură",
  description: "Rezultatul privat al profilului tău de lectură.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function RecommendationResultPage({
  params,
}: {
  params: Promise<{ opaqueToken: string }>;
}) {
  const { opaqueToken } = await params;
  const data = await getPublicRecommendationResult(opaqueToken);
  if (!data) notFound();

  return <RecommendationResult resultToken={opaqueToken} data={data} />;
}
