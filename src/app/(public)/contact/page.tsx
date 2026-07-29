import type { Metadata } from "next";

import { TrustPage } from "@/components/editorial/trust-page";
import { getServerEnv } from "@/lib/env/server";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPublicMetadata({
  title: "Contact",
  description: "Contact editorial, corecții și propuneri comerciale pentru CarteaZilei.",
  canonical: "/contact",
});

export default function ContactPage() {
  const contactEmail = getServerEnv().PUBLIC_CONTACT_EMAIL;

  return (
    <TrustPage eyebrow="Contact" title="Spune-ne contextul, nu doar titlul" intro="Folosim același canal pentru întrebări editoriale, corecții factuale și propuneri comerciale, dar evaluăm fiecare categorie după reguli diferite." path="/contact">
      <section><h2>Cu ce ne poți scrie</h2><ul className="mt-5"><li><strong>Corecție editorială:</strong> include URL-ul paginii, informația contestată și o sursă verificabilă.</li><li><strong>Propunere de carte:</strong> trimite datele ediției și motivul pentru care titlul ar merita evaluat; trimiterea nu garantează publicarea.</li><li><strong>Parteneriat comercial:</strong> precizează organizația și natura colaborării. O propunere comercială nu intră în scoringul recomandărilor.</li><li><strong>Confidențialitate:</strong> descrie solicitarea fără a trimite parole sau date sensibile inutile.</li></ul></section>
      {contactEmail ? (
        <section className="rounded-2xl border border-border bg-surface p-6"><h2>Canalul oficial</h2><p className="mt-4">Scrie la <a href={`mailto:${contactEmail}`} className="font-bold text-foreground underline underline-offset-4">{contactEmail}</a>. Nu trimite manuscrise complete sau fișiere sensibile nesolicitate.</p></section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-surface p-6"><h2>Canal în curs de configurare</h2><p className="mt-4">Adresa oficială nu a fost încă furnizată de proprietarul proiectului. Nu publicăm o adresă inventată; aceasta va apărea aici după configurarea `PUBLIC_CONTACT_EMAIL` la deployment.</p></section>
      )}
      <section><h2>Timp și trasabilitate</h2><p className="mt-4">Mesajele sunt prioritizate după impact, iar o solicitare comercială este păstrată separat de decizia editorială. Pentru corecții, păstrează URL-ul și sursele astfel încât modificarea să poată fi verificată.</p></section>
    </TrustPage>
  );
}
