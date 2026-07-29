import type { Metadata } from "next";
import Link from "next/link";

import { TrustPage } from "@/components/editorial/trust-page";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Politica editorială",
  description: "Standardele de documentare, publicare, corectare și independență editorială CarteaZilei.",
  canonical: "/politica-editoriala",
});

export default function EditorialPolicyPage() {
  return (
    <TrustPage eyebrow="Încredere" title="Analize asumate, surse clare, limite spuse direct" intro="Publicăm numai conținut care poate fi atribuit, revizuit și corectat. O carte nu devine recomandare doar pentru că este disponibilă comercial." path="/politica-editoriala">
      <section><h2>Standardul de publicare</h2><ul className="mt-5"><li>Fiecare analiză are editor și stare editorială explicită.</li><li>Verdictul, argumentele și rezervele sunt scrise separat de sinopsis.</li><li>Datele de ediție, ISBN-ul, numărul de pagini și coperta sunt tratate ca informații despre o ediție concretă.</li><li>Faptele despre autori și sursele sensibile trebuie documentate intern înainte de publicare.</li></ul></section>
      <section><h2>Ce nu publicăm</h2><p className="mt-4">Nu fabricăm recenzii, citate, testimoniale, ratinguri, premii, numere de cititori sau sigle de presă. Nu copiem descrieri comerciale și nu marcăm o informație drept verificată fără proces de verificare.</p></section>
      <section><h2>Corecții și actualizări</h2><p className="mt-4">Paginile importante afișează editorul și, când există, data revizuirii. O eroare factuală poate fi semnalată prin <Link href="/contact" className="font-bold text-foreground underline underline-offset-4">pagina de contact</Link>; corecțiile nu sunt ascunse prin rescriere promoțională.</p></section>
      <section><h2>Relația cu partenerii</h2><p className="mt-4">Afilierea monetizează ieșirea spre magazin, nu alegerea cărții. Sponsorizările și parteneriatele comerciale sunt marcate vizibil, păstrate în afara motorului de recomandare și evaluate separat de conținutul editorial.</p></section>
    </TrustPage>
  );
}
