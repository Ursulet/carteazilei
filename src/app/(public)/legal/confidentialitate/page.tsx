import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Confidențialitate" };

export default function PrivacyPage() {
  return (
    <PhasePlaceholder
      eyebrow="Legal"
      title="Politica de confidențialitate"
      description="Documentul final va descrie exact datele colectate de produs, perioadele de păstrare și drepturile utilizatorilor, după configurarea serviciilor folosite în producție."
    />
  );
}

