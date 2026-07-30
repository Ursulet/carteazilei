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
    <TrustPage eyebrow="Politica editorială" title="Analize asumate, surse clare, limite spuse direct" intro="Vrem ca fiecare recomandare să fie utilă, ușor de înțeles și corectabilă atunci când apare o eroare." path="/politica-editoriala">
      <section><h2>Cum scriem despre cărți</h2><ul className="mt-5"><li>Separăm prezentarea cărții de opinia editorului.</li><li>Spunem atât motivele recomandării, cât și posibilele limite.</li><li>Verificăm datele despre ediție, autor și copertă înainte de publicare.</li><li>Semnăm recomandările editoriale cu numele editorului.</li></ul></section>
      <section><h2>Ce nu publicăm</h2><p className="mt-4">Nu inventăm citate, premii, ratinguri sau testimoniale și nu prezentăm descrierile magazinelor drept opinii editoriale proprii.</p></section>
      <section><h2>Corecții și actualizări</h2><p className="mt-4">Dacă observi o informație greșită, o poți semnala prin <Link href="/contact" className="font-bold text-foreground underline underline-offset-4">pagina de contact</Link>. Verificăm sursa și corectăm pagina când este cazul.</p></section>
      <section><h2>Colaborări marcate clar</h2><p className="mt-4">O ofertă sponsorizată este etichetată „Promovat” sau „Parteneriat comercial”. O astfel de colaborare nu schimbă motivele editoriale ale recomandării.</p></section>
    </TrustPage>
  );
}
