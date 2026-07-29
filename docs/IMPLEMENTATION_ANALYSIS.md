# Analiză de implementare — CarteaZilei.ro 2.0

Data: 2026-07-29

## Stadiu

- Faza 01 — fundație și design system: finalizată.
- Faza 02 — PostgreSQL, Drizzle și modelul relațional: finalizată.
- Faza 03 — autentificare și shell admin: finalizată.
- Faza 04 — CMS editorial: finalizată.
- Faza 05 — homepage public și Cartea Zilei: finalizată.
- Faza 06 — pagini publice de carte și autor: finalizată.
- Extensie comercială — parteneri, oferte, transparență, tracking și raportare de bază: finalizată.
- Faza 07 — chestionarul de recomandare și sesiunea anonimă: finalizată.
- Faza 08 — scoring determinist, rezultate, explicații și feedback: finalizată.
- Faza 09 — hub-uri SEO și navigare editorială: finalizată.
- Faza 10 — căutare și discovery public: finalizată.
- Faza 11 — analytics și pagini de încredere: finalizată.
- Faza 12 — SEO tehnic și metadata: următoarea etapă.

## Rezumat

Produsul este o platformă editorială românească de book discovery, nu o librărie și nu un catalog social. Diferențiatorul este alegerea unei singure recomandări potrivite contextului cititorului, explicată prin argumente și limite sincere.

Cele trei motoare sunt:

1. Cartea Zilei — selecție editorială zilnică, unică și arhivată.
2. Recomandă-mi o carte — scor determinist și explicabil, cu maximum trei alternative progresive.
3. Book Intelligence — pagini editoriale de carte, autor, similaritate și continuare, optimizate pentru intenția de decizie.

## Arhitectură

- Next.js 16 App Router, React 19 și Server Components implicit.
- TypeScript strict cu `noUncheckedIndexedAccess`.
- Tailwind CSS 4.3 cu token-uri semantice CSS-first.
- PostgreSQL 18 cu Drizzle și migrații SQL versionate.
- Auth.js doar pentru echipa internă în V1.
- stocare S3-compatible izolată prin adaptor.
- deploy Docker în Coolify, cu PostgreSQL separat și neexpus public.

Business logic rămâne în `domain`, accesul la date în `db`, iar componentele React doar prezintă și orchestrează interacțiunea.

## Ordine de implementare

1. Fundație, shell, token-uri și configurare.
2. Model relațional și căutare PostgreSQL.
3. Autentificare și shell admin.
4. CMS editorial și workflow de publicare.
5. Homepage, Cartea Zilei și arhivă.
6. Pagini de carte și autor.
7. Quiz și captură de sesiune — finalizate.
8. Scoring, explicații, alternative și feedback — finalizate.
9. Hub-uri SEO, similaritate și next reads — finalizate.
10. Căutare publică — finalizată.
11. Analytics și pagini de încredere — finalizată.
12. SEO tehnic — următoarea etapă.
13. Import controlat și carantină pentru date vechi.
14. Pregătire Coolify.
15. Operaționalizare editorială și dashboard de lansare.

Faza QA/testare din promptul original 14 este exclusă din implementarea curentă. Prompturile următoare sunt renumerotate logic numai în acest document; fișierele-sursă rămân neschimbate.

## Riscuri și decizii importante

- Calitatea editorială este dependency critică: paginile incomplete nu trebuie publicate sau indexate.
- Work și edition trebuie separate din prima migrație pentru ISBN, copertă, pagini și oferte.
- Afilierea este separată de scoring; bid-ul sau retailerul nu poate influența recomandarea.
- Ofertele sunt încărcate numai după stabilirea cărții, iar clickurile și afișările comerciale sunt persistate într-un modul separat.
- Arhiva zilnică nu poate fi reconstruită din date aleatorii ori neverificabile.
- Rezultatele personale, căutarea internă și admin-ul sunt `noindex`.
- Rezultatele sunt snapshoturi versionate accesate printr-un capability token separat; scorul numeric intern nu este prezentat drept probabilitate publică.
- Similaritatea publică necesită motiv editorial; o muchie fără motiv nu se afișează.
- Hub-urile sunt indexabile numai după un quality gate recalculat din cărțile publice și sunt eliminate automat din sitemap dacă scad sub prag.
- Relațiile `next_read` declară explicit dacă păstrează tema, ritmul, stilul, lumea sau efectul emoțional; nu reutilizează lista de similaritate.
- Căutarea prioritizează titlul și autorul înaintea taxonomiilor, rulează cu timeout PostgreSQL și nu introduce un serviciu extern de indexare.
- Pagina de rezultate este `noindex, follow`, iar stările goale folosesc doar hub-uri editoriale reale, fără interogări sau tendințe inventate.
- Evenimentele de produs sunt tipate și normalizate; jurnalul nu acceptă payload JSON liber, email sau text sensibil.
- Dashboardul folosește denominatori expliciți și nu transformă lipsa datelor într-un procent de succes.
- Profilele editorilor sunt publice numai prin opt-in și biografie completată; modificările din admin sunt auditate.
- Prețurile se afișează numai când au sursă și prospețime defensibile.
- Conturile publice, embeddings și profilul de gust sunt Phase 2, după validarea buclei de recomandare.

## Abatere solicitată

Nu sunt create și nu sunt rulate teste unitare, de integrare, E2E, accesibilitate ori QA în etapele de implementare. Verificările automate de deployment rămân responsabilitatea proprietarului proiectului.
