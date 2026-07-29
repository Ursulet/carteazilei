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
    <TrustPage eyebrow="Despre CarteaZilei" title="Mai puține titluri. Alegeri mai bune." intro="CarteaZilei este o platformă românească de descoperire care combină selecția editorială, recomandarea personalizată explicabilă și paginile de orientare pentru cititori." path="/despre">
      <section><h2>Problema pe care o rezolvăm</h2><p className="mt-4">Un catalog foarte mare nu face automat alegerea mai ușoară. Construim context în jurul fiecărei recomandări: de ce merită, cui i se potrivește și ce limite ar trebui cunoscute înainte de lectură.</p></section>
      <section><h2>Cele trei direcții</h2><ul className="mt-5"><li><strong>Cartea Zilei</strong> este o alegere editorială datată și asumată.</li><li><strong>Recomandă-mi o carte</strong> folosește preferințe declarate și un scor determinist pentru a propune puține opțiuni explicate.</li><li><strong>Book Intelligence</strong> leagă analize, autori, teme, cărți asemănătoare și trasee de continuare.</li></ul></section>
      <section><h2>Ce nu suntem</h2><p className="mt-4">Nu suntem librărie, rețea socială sau clasament de popularitate. Nu vindem direct și nu prezentăm o colaborare comercială ca verdict editorial.</p></section>
      <section className="rounded-2xl border border-border bg-surface p-6"><h2>Responsabilitate publică</h2><p className="mt-4">Analizele publicate au editor și context verificabil. Poți vedea <Link href="/echipa" className="font-bold text-foreground underline underline-offset-4">echipa</Link>, <Link href="/cum-recomandam" className="font-bold text-foreground underline underline-offset-4">metodologia</Link> și <Link href="/politica-editoriala" className="font-bold text-foreground underline underline-offset-4">politica editorială</Link>.</p></section>
    </TrustPage>
  );
}
