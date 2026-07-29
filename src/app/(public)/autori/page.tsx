import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Autori" };

export default function AuthorsPage() {
  return (
    <PhasePlaceholder
      eyebrow="Ghiduri de lectură"
      title="De unde să începi cu un autor"
      description="Profilurile vor reuni informații verificate, cărțile analizate și o ordine de lectură argumentată acolo unde este relevantă."
    />
  );
}

