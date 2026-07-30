import type { Metadata } from "next";

import { TrustPage } from "@/components/editorial/trust-page";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Cum recomandăm",
  description: "Cum transformă CarteaZilei preferințele cititorului în recomandări explicate.",
  canonical: "/cum-recomandam",
});

export default function MethodologyPage() {
  return (
    <TrustPage eyebrow="Cum funcționează" title="O recomandare care pornește de la tine" intro="Ne uităm la ce ai chef să citești acum, la ritmul preferat și la lucrurile pe care vrei să le eviți." path="/cum-recomandam">
      <section><h2>Alegeri editoriale</h2><p className="mt-4">Cartea Zilei și listele tematice sunt pregătite de editori. Pentru fiecare titlu explicăm de ce l-am ales, cui i s-ar potrivi și ce merită știut înainte de lectură.</p></section>
      <section><h2>Recomandarea personalizată</h2><p className="mt-4">Răspunsurile tale sunt comparate cu genul, temele, ritmul, lungimea și atmosfera cărților din catalog. Primești o opțiune principală și, când există, câteva alternative apropiate.</p></section>
      <section><h2>Pașii sunt simpli</h2><ol className="mt-5 list-decimal space-y-3 ps-5"><li>Ne spui ce cauți și ce ai prefera să eviți.</li><li>Căutăm cărțile care se potrivesc acestor preferințe.</li><li>Alegem recomandarea cea mai apropiată de contextul tău.</li><li>Îți explicăm motivele și limita principală a alegerii.</li><li>Dacă există oferte, le afișăm după recomandare.</li></ol></section>
      <section><h2>Cum ajută feedbackul</h2><p className="mt-4">Poți spune dacă recomandarea pare potrivită sau nu. Cu acordul tău pentru statistici, folosim aceste răspunsuri în formă agregată pentru a îmbunătăți experiența.</p></section>
    </TrustPage>
  );
}
