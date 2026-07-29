# CarteaZilei.ro — Production Readiness

Data evaluării: 29 iulie 2026  
Verdict curent: **NU ESTE ÎNCĂ APROBAT PENTRU PRODUCȚIE**

Acest verdict este intenționat conservator. Implementarea fazei de hardening este
încheiată, însă validările de deployment și faza QA au fost amânate explicit de
proprietarul proiectului. Documentul nu transformă verificările statice în dovezi
de funcționare într-un mediu real.

## Rezultatul verificărilor statice

| Poartă | Rezultat | Observație |
| --- | --- | --- |
| TypeScript | PASS | `npm.cmd run typecheck` |
| ESLint | PASS | `npm.cmd run lint` |
| Build de producție | PASS | `npm.cmd run build`, cu variabile locale demonstrative, fără credențiale persistate |
| Imagine Docker | BLOCAT LOCAL | Docker nu este instalat în mediul de implementare; buildul targeturilor `runner` și `migrator` trebuie confirmat în Coolify |
| Teste automate și E2E | AMÂNAT | Vor fi executate la deployment de proprietarul proiectului |
| Accesibilitate automată/manuală | AMÂNAT | Necesită aplicația rulată și verificare reală cu tastatura/screen reader |
| Performanță și Core Web Vitals | AMÂNAT | Nu există încă măsurători Lighthouse/teren pentru mediul de producție |
| SEO smoke-check | AMÂNAT | Necesită domeniul, TLS-ul și răspunsurile finale ale infrastructurii |

## Controale implementate și inspectate

- Adminul verifică utilizatorul și rolurile din baza de date, nu se bazează doar
  pe roluri serializate în token; mutațiile folosesc verificări explicite de acces.
- Loginul folosește Argon2id, sesiuni limitate și rate limiting persistent pe IP și
  combinația adresă–email.
- Endpointurile publice de mutație validează originea same-origin, au rate limit,
  răspunsuri `no-store`/`noindex` și acceptă JSON limitat la 32 KB.
- Serviciile editoriale și comerciale verifică apartenența identificatorilor la
  resursa părinte înaintea operațiilor sensibile, reducând riscul IDOR.
- Redirectul comercial acceptă doar o ofertă activă și coerentă cu contextul,
  revalidează URL-ul final ca HTTPS fără credențiale și este protejat prin rate
  limiting înaintea urmăririi clickului.
- Uploadul media are limită de dimensiune, validează semnătura reală a imaginii,
  tipul MIME și numărul maxim de pixeli înaintea stocării.
- React randează conținutul editorial ca text, iar serializarea JSON-LD neutralizează
  caracterele care ar putea închide un element `script`.
- Răspunsurile includ CSP, protecție anti-framing, `nosniff`, Permissions Policy,
  COOP, CORP, Origin-Agent-Cluster și HSTS în producție.
- Fișierele de mediu reale nu sunt urmărite de Git; `.env.example` conține numai
  valori demonstrative. Baza PostgreSQL din compoziția locală ascultă doar pe
  `127.0.0.1`.
- Recomandarea este calculată exclusiv din profilul editorial al cititorului și al
  cărții; ofertele, afilierea, prețul și sponsorizarea sunt atașate numai după
  alegerea cărții.

## Riscuri reziduale cunoscute

- CSP folosește momentan `unsafe-inline` pentru scripturile și stilurile necesare
  randării Next.js. Migrarea la nonce/hash poate reduce suplimentar suprafața XSS,
  dar necesită o schimbare transversală și validare în browser.
- Identificarea IP pentru rate limiting presupune că aplicația primește
  `CF-Connecting-IP`, `X-Real-IP` sau `X-Forwarded-For` numai de la proxy-ul de
  încredere. Coolify/proxy-ul trebuie configurat să suprascrie aceste headere.
- Permisiunile bucketului S3, politica CORS, retenția și restaurarea backupurilor nu
  pot fi demonstrate din repository.
- Dockerfile-ul și outputul standalone sunt prezente, dar imaginea nu a fost
  construită local deoarece daemonul/CLI-ul Docker nu este disponibil în acest mediu.
- Nu există încă date de laborator sau de teren pentru LCP, INP și CLS.
- Importul legacy este implementat, dar nu a fost rulat pe exportul real și nu
  există încă raportul de dry-run pentru conținutul de producție.

## Porți obligatorii la deployment

Proiectul poate primi verdictul **READY** numai după ce proprietarul completează și
notează rezultatul următoarelor verificări:

1. Rulează migrațiile pe o copie/instanță controlată, verifică schema și execută un
   restore real din backup.
2. Rulează fluxurile critice: autentificare, roluri, CRUD editorial, preview,
   publicare, quiz, rezultat, feedback, căutare, ofertă și redirect afiliat.
3. Verifică explicit accesul neautorizat, escaladarea rolurilor, IDOR, CSRF, XSS,
   uploadurile invalide, brute force și redirecturile manipulate.
4. Rulează verificările de accesibilitate automate și manuale pentru tastatură,
   focus, contrast, formulare și screen reader.
5. Măsoară homepage, pagină de carte, hub SEO și quiz pe mobil și desktop; corectează
   orice regresie severă de LCP, INP sau CLS înainte de lansare.
6. Confirmă pe domeniul final canonicalele, robots.txt, sitemap.xml, JSON-LD,
   Open Graph, paginile 404, redirecturile legacy și `noindex` pe admin/API.
7. Confirmă HTTPS, headerele proxy, baza de date fără expunere publică, bucketul
   privat, logurile fără secrete și rotația secretelor de bootstrap.
8. Rulează importul legacy în mod dry-run, aprobă raportul de carantină și abia apoi
   execută importul real cu backup și plan de rollback.

Până la închiderea acestor porți, verdictul rămâne **NOT READY / DEPLOYMENT
VALIDATION REQUIRED**.
