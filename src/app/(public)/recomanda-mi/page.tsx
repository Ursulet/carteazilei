import type { Metadata } from "next";
import { cookies } from "next/headers";

import { RecommendationQuiz } from "@/components/recommendation/recommendation-quiz";
import { getRecommendationQuizOptions } from "@/db/queries/recommendation-quiz";
import {
  getRecommendationSessionByRawToken,
  recommendationSessionCookie,
} from "@/domain/recommendation/session-service";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPublicMetadata({
  title: "Recomandă-mi o carte",
  description: "Răspunde la șase întrebări și construiește contextul pentru o recomandare de carte personalizată și explicată.",
  canonical: "/recomanda-mi",
});

export default async function RecommendationPage() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(recommendationSessionCookie)?.value;
  const [options, initialSession] = await Promise.all([
    getRecommendationQuizOptions(),
    getRecommendationSessionByRawToken(rawToken).catch((error) => {
      console.error("Recommendation session could not be resumed", error);
      return null;
    }),
  ]);

  return <RecommendationQuiz genres={options.genres} initialSession={initialSession} />;
}
