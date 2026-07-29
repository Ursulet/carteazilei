import type { Metadata } from "next";

import { TrustPage } from "@/components/editorial/trust-page";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Cum recomandăm",
  description: "Metodologia editorială și algoritmică folosită de CarteaZilei.",
  canonical: "/cum-recomandam",
});

export default function MethodologyPage() {
  return (
    <TrustPage eyebrow="Metodologie" title="Potrivirea înaintea popularității" intro="O recomandare bună începe cu contextul cititorului, continuă cu o carte eligibilă editorial și abia apoi poate afișa locurile în care aceasta se găsește." path="/cum-recomandam">
      <section><h2>Două tipuri de recomandare</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-surface p-5"><h3>Editorială</h3><p className="mt-2 text-sm">Cartea Zilei, listele și relațiile dintre titluri sunt selectate sau aprobate de un editor și au motive publice.</p></div><div className="rounded-2xl border border-border bg-surface p-5"><h3>Algoritmică, dar explicabilă</h3><p className="mt-2 text-sm">Quiz-ul compară răspunsurile cu etichete și trăsături controlate. Nu folosește un LLM drept arbitru și nu ascunde criteriile sub o probabilitate inventată.</p></div></div></section>
      <section><h2>Cum sunt descrise cărțile</h2><p className="mt-4">Editorii atribuie genuri, teme, stări, audiențe și scoruri pentru ritm, complexitate, intensitate emoțională sau construcția lumii. Etichetele publice nu sunt generate automat pentru volum SEO.</p></section>
      <section><h2>Ordinea deciziei</h2><ol className="mt-5 list-decimal space-y-3 ps-5"><li>Colectăm preferințele declarate și limitele cititorului.</li><li>Eliminăm cărțile neeligibile și incompatibilitățile ferme.</li><li>Calculăm potrivirea și alegem rezultatul principal, cu maximum două alternative.</li><li>Explicăm motivele și un caveat editorial real.</li><li>Numai după alegere încărcăm ofertele comerciale asociate cărții.</li></ol></section>
      <section><h2>Cum ajută feedbackul</h2><p className="mt-4">Semnalele „pare potrivită”, „nu prea”, „am început-o” și „am terminat-o” sunt folosite agregat pentru evaluarea versiunilor viitoare. Nu schimbă instantaneu rezultatul curent și nu sunt prezentate public drept rating al cărții.</p></section>
      <section className="rounded-2xl border border-accent bg-accent-soft/40 p-6"><h2>Firewall comercial</h2><p className="mt-4">Partenerul, prețul, comisionul afiliat și sponsorizarea nu intră în scor. O plasare plătită este marcată separat și nu poate fi numită „alegerea noastră pentru tine”.</p></section>
    </TrustPage>
  );
}
