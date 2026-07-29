import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = {
  title: "Caută",
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <PhasePlaceholder
      eyebrow="Căutare"
      title="Caută o carte, un autor sau o temă"
      description="Căutarea tolerantă la diacritice și greșeli va fi conectată la catalog după implementarea modelului de date."
    />
  );
}

