import type { Metadata } from "next";
import Link from "next/link";

import { TrustPage } from "@/components/editorial/trust-page";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Despre CarteaZilei",
  description: "Misiunea și principiile platformei editoriale românești CarteaZilei.",
  canonical: "/despre",
});

export default function AboutPage() {
  return (
    <TrustPage eyebrow="Despre Cartea Zilei" title="Mai puține titluri. Alegeri mai bune." intro="Cartea Zilei te ajută să găsești o lectură potrivită fără să te pierzi într-un catalog nesfârșit." path="/despre">
      <section><h2>Problema pe care o rezolvăm</h2><p className="mt-4">Un catalog foarte mare nu face automat alegerea mai ușoară. Construim context în jurul fiecărei recomandări: de ce merită, cui i se potrivește și ce limite ar trebui cunoscute înainte de lectură.</p></section>
      <section><h2>Ce găsești aici</h2><ul className="mt-5"><li><strong>Cartea Zilei</strong>, o recomandare explicată pe înțelesul cititorului.</li><li><strong>Recomandă-mi o carte</strong>, o alegere pornită de la preferințele tale.</li><li><strong>Ghiduri și colecții</strong> care leagă autori, teme și cărți potrivite pentru aceeași stare de lectură.</li></ul></section>
      <section><h2>Ce nu suntem</h2><p className="mt-4">Nu suntem librărie, rețea socială sau clasament de popularitate. Scopul nostru este să facem alegerea mai ușoară.</p></section>
      <section className="rounded-2xl border border-border bg-surface p-6"><h2>Responsabilitate publică</h2><p className="mt-4">Analizele publicate au editor și context verificabil. Poți vedea <Link href="/echipa" className="font-bold text-foreground underline underline-offset-4">echipa</Link>, <Link href="/cum-recomandam" className="font-bold text-foreground underline underline-offset-4">metodologia</Link> și <Link href="/politica-editoriala" className="font-bold text-foreground underline underline-offset-4">politica editorială</Link>.</p></section>
    </TrustPage>
  );
}
