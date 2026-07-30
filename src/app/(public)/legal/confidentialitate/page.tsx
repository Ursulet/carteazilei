import type { Metadata } from "next";

import { TrustPage } from "@/components/editorial/trust-page";
import { CookieSettingsButton } from "@/components/privacy/cookie-settings-button";
import { getPublicSiteSettings } from "@/domain/settings/public-settings-service";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPublicMetadata({
  title: "Confidențialitate și cookie-uri",
  description: "Cum folosește Cartea Zilei cookie-urile și datele necesare funcționării site-ului.",
  canonical: "/legal/confidentialitate",
});

export default async function PrivacyPage() {
  const settings = await getPublicSiteSettings();
  return (
    <TrustPage eyebrow="Confidențialitate" title="Datele tale, explicate simplu" intro="Folosim datele necesare pentru ca site-ul să funcționeze. Statisticile și măsurarea interacțiunilor pornesc numai dacă le accepți." path="/legal/confidentialitate">
      <section><h2>Cine administrează datele</h2><p className="mt-4">Operatorul site-ului este <strong className="text-foreground">{settings.privacyControllerName}</strong>.</p>{settings.privacyContactEmail ? <p className="mt-2">Pentru întrebări sau solicitări privind datele personale, scrie la <a href={`mailto:${settings.privacyContactEmail}`} className="font-bold text-foreground underline underline-offset-4">{settings.privacyContactEmail}</a>.</p> : null}{settings.privacyContactAddress ? <p className="mt-2 whitespace-pre-line">Adresă: {settings.privacyContactAddress}</p> : null}</section>
      <section><h2>Cookie-uri necesare</h2><ul className="mt-5"><li>Păstrăm alegerea ta privind cookie-urile, ca să nu te întrebăm la fiecare pagină.</li><li>Când începi recomandarea personalizată, o sesiune temporară păstrează răspunsurile și îți permite să vezi rezultatul.</li><li>Pentru echipa internă, cookie-ul de autentificare protejează accesul la administrare.</li></ul><p className="mt-4">Aceste cookie-uri sunt folosite numai pentru serviciul cerut, securitate și preferințele tale.</p></section>
      <section><h2>Statistici opționale</h2><p className="mt-4">Dacă accepți statisticile, putem înregistra pagina vizitată, momentul, domeniul de referință și interacțiuni precum deschiderea unei recomandări sau a unei oferte. Evenimentele nu conțin emailul tău, iar identificatorul folosit pentru statistici nu este creat din amprenta dispozitivului.</p><p className="mt-4">Dacă alegi „Doar necesare”, aceste evenimente nu sunt trimise. Poți retrage acordul oricând.</p><div className="mt-5"><CookieSettingsButton variant="button" /></div></section>
      <section><h2>Recomandarea personalizată</h2><p className="mt-4">Răspunsurile sunt folosite pentru a calcula și afișa recomandarea solicitată. Feedbackul tău nu devine rating public și nu este folosit pentru publicitate comportamentală.</p></section>
      <section><h2>Linkuri către parteneri</h2><p className="mt-4">Când deschizi o ofertă, ești redirecționat către site-ul partenerului. Măsurăm clickul în Cartea Zilei numai dacă ai acceptat statisticile. Site-ul partenerului are propria politică de confidențialitate.</p></section>
      <section><h2>Cât timp păstrăm datele</h2><p className="mt-4 whitespace-pre-line">{settings.privacyRetentionText}</p></section>
      <section><h2>Drepturile tale</h2><p className="mt-4">Poți cere accesul, corectarea, ștergerea, restricționarea sau portarea datelor care te privesc și te poți opune anumitor prelucrări. Când prelucrarea se bazează pe consimțământ, îl poți retrage fără a afecta utilizarea anterioară.</p><p className="mt-4">Dacă răspunsul nostru nu rezolvă problema, te poți adresa <a href="https://www.dataprotection.ro/" target="_blank" rel="noreferrer" className="font-bold text-foreground underline underline-offset-4">Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal</a>.</p></section>
      {settings.privacyAdditionalText ? <section><h2>Informații suplimentare</h2><p className="mt-4 whitespace-pre-line">{settings.privacyAdditionalText}</p></section> : null}
    </TrustPage>
  );
}
