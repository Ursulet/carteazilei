import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Afiliere" };

export default function AffiliationPage() {
  return (
    <PhasePlaceholder
      eyebrow="Transparență comercială"
      title="Afilierea susține produsul, nu decide recomandarea"
      description="Unele linkuri către librării vor putea genera un comision fără cost suplimentar pentru cititor. Acest lucru nu va modifica selecția editorială."
    />
  );
}

