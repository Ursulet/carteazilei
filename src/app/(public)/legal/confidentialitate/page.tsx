import type { Metadata } from "next";

import { TrustPage } from "@/components/editorial/trust-page";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Confidențialitate",
  description: "Datele tehnice și de utilizare prelucrate de CarteaZilei.",
  canonical: "/legal/confidentialitate",
});

export default function PrivacyPage() {
  return (
    <TrustPage eyebrow="Confidențialitate" title="Măsurăm produsul fără profilare agresivă" intro="Această pagină descrie implementarea tehnică actuală. Identitatea operatorului, termenele juridice finale și formulările legale trebuie validate înainte de lansare." path="/legal/confidentialitate">
      <section><h2>Date de utilizare</h2><p className="mt-4">Pentru a înțelege dacă recomandarea funcționează, păstrăm tipul evenimentului, momentul, pagina și identificatorii interni ai cărții, rezultatului sau ofertei. Pentru pagina de intrare păstrăm numai canalul și hostname-ul referentului, nu URL-ul complet sau termenul căutat. Identificatorul anonim din baza de date este un hash; nu include email și nu este construit din amprenta dispozitivului.</p></section>
      <section><h2>Quiz și feedback</h2><p className="mt-4">Răspunsurile quiz-ului sunt legate de o sesiune anonimă și sunt folosite pentru calcularea rezultatului. Feedbackul despre potrivire sau progresul lecturii este păstrat separat și nu devine rating public. Nu introduce în câmpurile libere informații sensibile.</p></section>
      <section><h2>Cookie-uri first-party</h2><ul className="mt-5"><li>Sesiunea de recomandare este temporară și permite reluarea quiz-ului.</li><li>Identificatorul anonim de produs are maximum 30 de zile și este `HttpOnly`, `SameSite=Lax`.</li><li>Sesiunea admin este folosită numai pentru echipa internă autentificată.</li></ul></section>
      <section><h2>Linkuri externe</h2><p className="mt-4">Când deschizi oferta unui partener, CarteaZilei înregistrează clickul și apoi te redirecționează. Site-ul partenerului aplică propria politică de confidențialitate și poate folosi parametri de afiliere.</p></section>
      <section className="rounded-2xl border border-dashed border-border bg-surface p-6"><h2>Înainte de lansare</h2><p className="mt-4">Operatorul trebuie să completeze datele de contact, temeiurile juridice, perioadele exacte de retenție, furnizorii de infrastructură și procedura de exercitare a drepturilor. Nu prezentăm acest text tehnic drept consultanță juridică finală.</p></section>
    </TrustPage>
  );
}
