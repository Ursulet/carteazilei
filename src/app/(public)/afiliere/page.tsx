import type { Metadata } from "next";

import { TrustPage } from "@/components/editorial/trust-page";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Despre linkurile către librării",
  description: "Informații esențiale despre ofertele și linkurile externe afișate de Cartea Zilei.",
  canonical: "/afiliere",
  index: false,
});

export default function AffiliationPage() {
  return (
    <TrustPage eyebrow="Informații despre oferte" title="Unde poți găsi cartea" intro="Unele pagini includ linkuri către edituri sau librării. Comanda și plata au loc pe site-ul partenerului." path="/afiliere">
      <section><h2>Linkuri de afiliere</h2><p className="mt-4">Dacă un link este afiliat, Cartea Zilei poate primi un comision atunci când cumperi, fără cost suplimentar pentru tine. Marcăm acest lucru lângă ofertele relevante.</p></section>
      <section><h2>Oferte promovate</h2><p className="mt-4">O colaborare plătită este marcată clar cu „Promovat” sau „Parteneriat comercial”.</p></section>
      <section><h2>Preț și disponibilitate</h2><p className="mt-4">Prețul și stocul final sunt cele afișate pe site-ul partenerului în momentul cumpărării.</p></section>
    </TrustPage>
  );
}
