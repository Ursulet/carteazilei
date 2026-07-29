import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Cum recomandăm" };

export default function MethodologyPage() {
  return (
    <PhasePlaceholder
      eyebrow="Metodologie"
      title="Potrivirea înaintea popularității"
      description="Recomandările vor combina o taxonomie editorială controlată cu un scor determinist și explicabil. Nicio ofertă comercială nu va intra în calculul potrivirii."
    />
  );
}

