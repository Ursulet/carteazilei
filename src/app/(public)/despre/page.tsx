import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Despre" };

export default function AboutPage() {
  return (
    <PhasePlaceholder
      eyebrow="Despre Cartea Zilei"
      title="Mai puține titluri. Alegeri mai bune."
      description="Cartea Zilei este o platformă românească de descoperire și recomandare care combină selecția editorială cu personalizarea explicabilă."
      note="Afilierea va monetiza decizia, fără să dicteze recomandarea editorială."
    />
  );
}

