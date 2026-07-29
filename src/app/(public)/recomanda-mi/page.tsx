import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Recomandă-mi o carte" };

export default function RecommendationPage() {
  return (
    <PhasePlaceholder
      eyebrow="Recomandare personalizată"
      title="Spune-ne ce cauți. Noi alegem una."
      description="Fluxul va porni de la nevoia ta de lectură și va întoarce o alegere principală, explicată, cu alternative numai la cerere."
      note="Motorul determinist și formularul de recomandare sunt planificate în fazele 7 și 8."
    />
  );
}

