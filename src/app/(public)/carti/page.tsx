import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Cărți" };

export default function BooksPage() {
  return (
    <PhasePlaceholder
      eyebrow="Catalog editorial"
      title="Cărți alese pentru decizii mai bune"
      description="Paginile de carte vor reuni verdictul editorial, profilul de lectură, limitele și recomandările înrudite. Conținutul va apărea numai după validarea editorială."
      note="Această rută este pregătită în fundație. Catalogul public este implementat în fazele editoriale următoare."
    />
  );
}

