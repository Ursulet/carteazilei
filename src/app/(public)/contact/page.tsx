import type { Metadata } from "next";

import { TrustPage } from "@/components/editorial/trust-page";
import { ContactForm } from "@/components/communication/contact-form";
import { getPublicSiteSettings } from "@/domain/settings/public-settings-service";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { submitContactAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPublicMetadata({
  title: "Contact",
  description: "Contact editorial, corecții și propuneri comerciale pentru CarteaZilei.",
  canonical: "/contact",
});

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();
  const contactEmail = settings.contactEmail;

  return (
    <TrustPage eyebrow="Contact" title="Scrie-ne" intro="Ne poți trimite o corecție, o propunere de carte, o întrebare despre confidențialitate sau o idee de colaborare." path="/contact">
      {settings.featureContactForm ? <section><h2>Trimite un mesaj</h2><p className="mt-3">Mesajul este salvat în siguranță și ajunge în inbox-ul echipei.</p><div className="mt-6"><ContactForm action={submitContactAction} /></div></section> : null}
      <section><h2>Cu ce ne poți scrie</h2><ul className="mt-5"><li><strong>Corecție editorială:</strong> include URL-ul paginii, informația contestată și o sursă verificabilă.</li><li><strong>Propunere de carte:</strong> trimite datele ediției și motivul pentru care titlul ar merita evaluat; trimiterea nu garantează publicarea.</li><li><strong>Parteneriat comercial:</strong> precizează organizația și natura colaborării.</li><li><strong>Confidențialitate:</strong> descrie solicitarea fără a trimite parole sau date sensibile inutile.</li></ul></section>
      {contactEmail || settings.contactPhone || settings.contactAddress ? (
        <section className="rounded-2xl border border-border bg-surface p-6"><h2>Date de contact</h2>{contactEmail ? <p className="mt-4">Email: <a href={`mailto:${contactEmail}`} className="font-bold text-foreground underline underline-offset-4">{contactEmail}</a></p> : null}{settings.contactPhone ? <p className="mt-2">Telefon: <a href={`tel:${settings.contactPhone.replace(/\s+/g, "")}`} className="font-bold text-foreground underline underline-offset-4">{settings.contactPhone}</a></p> : null}{settings.contactAddress ? <p className="mt-2 whitespace-pre-line">Adresă: {settings.contactAddress}</p> : null}<p className="mt-4 text-sm">Nu trimite manuscrise complete sau fișiere sensibile nesolicitate.</p></section>
      ) : (
        <section className="rounded-2xl border border-border bg-surface p-6"><h2>Contactul va fi disponibil în curând</h2><p className="mt-4">Pregătim canalul oficial de contact. Revino pe această pagină pentru adresa actualizată.</p></section>
      )}
      <section><h2>Pentru un răspuns mai rapid</h2><p className="mt-4">Dacă semnalezi o eroare, include linkul paginii și sursa corectă. Nu trimite parole, documente de identitate sau alte date sensibile care nu sunt necesare.</p></section>
    </TrustPage>
  );
}
