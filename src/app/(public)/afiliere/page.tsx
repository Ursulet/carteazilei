import type { Metadata } from "next";

import { TrustPage } from "@/components/editorial/trust-page";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Afiliere și parteneriate comerciale",
  description: "Cum funcționează linkurile afiliate și sponsorizările pe CarteaZilei.",
  canonical: "/afiliere",
});

export default function AffiliationPage() {
  return (
    <TrustPage eyebrow="Transparență comercială" title="Afilierea susține produsul, nu decide recomandarea" intro="După ce recomandarea editorială este stabilită, putem arăta edituri, librării, marketplace-uri sau distribuitori unde cartea este disponibilă." path="/afiliere">
      <section className="rounded-2xl border border-accent bg-accent-soft/40 p-6"><h2>Disclosure folosit lângă oferte</h2><p className="mt-4 font-medium text-foreground">Unele linkuri pot fi de afiliere. Dacă cumperi prin ele, Cartea Zilei poate primi un comision, fără cost suplimentar pentru tine. Acest lucru nu influențează recomandarea editorială.</p><p className="mt-3 text-xs">Formularea va fi revizuită juridic înainte de lansare.</p></section>
      <section><h2>Link afiliat</h2><p className="mt-4">Un link afiliat poate genera un comision dacă achiziția este finalizată la partener. Cartea, ordinea editorială și explicația recomandării sunt stabilite înainte ca ofertele să fie încărcate.</p></section>
      <section><h2>Parteneriat comercial sau promovare</h2><p className="mt-4">O colaborare plătită este diferită de afilierea tehnică. Astfel de plasări sunt etichetate „Promovat” sau „Parteneriat comercial” și au prezentare distinctă. Nu sunt introduse în recomandarea personalizată ca și cum ar fi rezultatul potrivirii.</p></section>
      <section><h2>Preț și disponibilitate</h2><p className="mt-4">Afișăm prețul numai când are o verificare suficient de recentă. Prețul și stocul final sunt cele de pe site-ul partenerului; CarteaZilei nu procesează comanda și plata.</p></section>
    </TrustPage>
  );
}
