import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Liste editoriale" };

export default function ListsPage() {
  return (
    <PhasePlaceholder
      eyebrow="Selecții tematice"
      title="Liste scurte, cu un motiv pentru fiecare alegere"
      description="Listele editoriale vor răspunde unei intenții clare și nu vor fi colecții generate automat din filtre."
    />
  );
}

