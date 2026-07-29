import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Politica editorială" };

export default function EditorialPolicyPage() {
  return (
    <PhasePlaceholder
      eyebrow="Încredere"
      title="Analize asumate, surse clare, limite spuse direct"
      description="Nu publicăm recenzii fabricate, atribuiri incerte sau sinopsisuri copiate. Fiecare analiză importantă va avea editor și dată de revizuire."
    />
  );
}

