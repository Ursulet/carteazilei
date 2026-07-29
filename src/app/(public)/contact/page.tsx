import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PhasePlaceholder
      eyebrow="Contact"
      title="O conversație editorială începe cu context"
      description="Canalele operaționale de contact vor fi publicate înainte de lansare, după configurarea fluxului de email și a politicilor de confidențialitate."
    />
  );
}

