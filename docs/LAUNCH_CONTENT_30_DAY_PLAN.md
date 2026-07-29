# Conținutul de lansare și primele 30 de zile

Acest document operaționalizează ultima fază fără a crea cărți, autori, relații,
oferte sau rezultate fictive. Sursa de adevăr pentru lipsuri este raportul din
`/admin/readiness`; indicatorii de produs sunt în `/admin/recommendations`.

## 1. Ce înseamnă un nucleu de lansare credibil

Țintele editoriale sunt repere, nu praguri care justifică texte slabe:

- 100 pagini de carte solide;
- 20 profiluri de autor publicate;
- minimum 20 hub-uri/liste care trec quality gate-ul;
- minimum 10 pagini „ce să citești după” cu suficiente relații aprobate;
- Cartea Zilei programată pentru următoarele săptămâni;
- toate paginile de încredere implementate, cu formulările juridice finale validate.

O „pagină de carte solidă” este publicată și nu are, în raportul curent:

- rezervă editorială lipsă;
- profil de traits incomplet ori cu confidence sub 50;
- editor lipsă;
- relații similare aprobate lipsă;
- status editorial care cere revizie.

Absența unei oferte nu face analiza editorială falsă sau nepublicabilă, dar apare
separat în readiness pentru pregătirea comercială. Prețul, afilierea și partenerul
nu intră în definiția calității recomandării.

## 2. Coada editorială înainte de lansare

Ordinea recomandată pentru lucru este:

1. `Pagină de carte care necesită revizie` și `Editor lipsă`;
2. `Carte publicată fără rezervă editorială`;
3. `Profil de lectură incomplet sau nesigur`;
4. `Fără relații similare aprobate`;
5. `Hub SEO sub quality gate`;
6. `Gol în calendarul Cartea Zilei`;
7. `Fără ofertă activă` și `Ofertă neverificată de peste 30 de zile`.

Ordinea protejează mai întâi adevărul editorial și motorul de recomandare, apoi
descoperirea SEO și abia după aceea monetizarea. Fiecare corecție trebuie să aibă
o sursă sau judecată editorială reală; raportul nu completează automat câmpuri.

## 3. Pregătirea calendarului

Raportul verifică o fereastră mobilă de 28 de zile în fusul
`Europe/Bucharest`. O zi este acoperită numai dacă selecția are status `scheduled`
sau `published`; o ciornă rezervă data în DB, dar este afișată ca problemă.

Ritmul editorial minim:

- verificare săptămânală a ferestrei de 28 de zile;
- cel puțin două persoane implicate în planificare/revizie, dacă echipa permite;
- oferta principală verificată separat și niciodată folosită pentru alegerea cărții;
- arhiva începe numai cu selecții autentice, nu este completată retroactiv.

## 4. Dashboardul primelor 30 de zile

Dashboardul folosește o fereastră mobilă de 30 de zile și expune:

| Indicator | Sursă | Interpretare |
| --- | --- | --- |
| intrări organice | eveniment first-party `page_viewed` + hostname de motor de căutare | achiziție, nu calitatea recomandării |
| eșantion indexare | Search Console | rămâne `—` până la conectare/verificare reală |
| finalizare quiz | sesiuni pornite/finalizate | fricțiunea fluxului |
| feedback pozitiv | pozitiv / (pozitiv + negativ) | North Star pentru răspunsurile evaluate |
| cereri de alternativă | sesiuni cu alternativă / rezultat principal afișat | posibilă nepotrivire sau curiozitate; necesită context |
| CTR retailer | clickuri / impresii comerciale | utilitatea secțiunii comerciale, nu semnal de ranking |
| zero / confidence scăzut | generări cerute fără rezultat ori scor principal sub 50 | goluri în catalog și profil editorial |
| top pagini | evenimente `page_viewed` | interes observat; nu măsoară timpul de lectură |

Trackingul de achiziție stochează calea internă, canalul, faptul că vizita este o
intrare și hostname-ul referentului. Nu stochează URL-ul complet, termenul căutat,
emailul, fingerprintul sau IP-ul în tabela de produs. Datele există numai din
momentul aplicării migrației `0010`.

## 5. Eșantionul de indexare

Nu deduce indexarea din sitemap și nu considera un URL „indexat” doar pentru că
răspunde 200. După conectarea proprietății Search Console:

1. definește săptămânal un eșantion de minimum 20 URL-uri eligibile: cărți, autori,
   hub-uri/liste și pagini datate;
2. păstrează URL-ul, tipul, data verificării și rezultatul real din Search Console;
3. separă `indexed`, `discovered/crawled not indexed`, canonical alternativ și
   eroare tehnică;
4. nu include admin, căutare, rezultate private sau pagini sub quality gate;
5. afișează în dashboard numai după ce există o sursă conectată ori un import
   controlat. Până atunci starea corectă este `— / neconectat`.

Integrarea API Search Console nu este introdusă înainte de deployment: ar cere
OAuth/service account, proprietatea reală și o decizie operațională a titularului.

## 6. Cadenta 0–30 zile

### Zilele 0–3

- confirmă porțile din `PRODUCTION_READINESS.md`;
- aplică migrațiile și notează momentul de la care trackingul este complet;
- trimite sitemapul și verifică robots/canonical/HTTPS;
- verifică zilnic health, erori, backup și primele situații zero-result;
- nu schimba ponderile motorului din câteva sesiuni izolate.

### Zilele 4–7

- examinează funnelul quiz și locul abandonului;
- verifică manual toate feedbackurile negative disponibile, fără a publica textul;
- verifică ofertele cu clickuri și fără clickuri numai după ce au impresii suficiente;
- corectează erori tehnice/indexare confirmate, nu fluctuații de poziție.

### Zilele 8–14

- prioritizează profilurile zero/low-confidence recurente;
- completează traits, audiențe și relații pentru golurile demonstrate;
- îmbunătățește paginile de intrare organice care au conținut incomplet;
- păstrează zilnic calendarul Cartea Zilei și verificarea ofertelor.

### Zilele 15–21

- compară două săptămâni de cohortă, fără a confunda volum mic cu tendință;
- analizează alternativele împreună cu feedbackul pozitiv/negativ și scorul;
- extinde numai hub-urile pentru care există conținut editorial suficient;
- verifică din nou eșantionul de indexare și canonicalele problematice.

### Zilele 22–30

- calculează baseline-ul North Star și intervalul de încredere operațional;
- documentează cele mai frecvente trei goluri de catalog/profil;
- decide backlogul lunii următoare din datele perioadei;
- programează testul lunar de restore și revizuirea retenției analytics;
- nu aprobă o extindere majoră dacă bucla quiz → recomandare → feedback nu este
  încă validată.

## 7. Cum se creează backlogul de optimizare

Înainte de date de producție, backlogul conține numai instrumentare, readiness și
remedieri demonstrate. Nu există acum o listă inventată de „feature-uri cerute de
utilizatori”.

Pentru fiecare candidat după lansare, înregistrează:

- semnalul și intervalul exact;
- denominatorul, nu doar numărul brut;
- segmentul/profilul afectat;
- ipoteza cauzală;
- schimbarea minimă propusă;
- metrica principală și guardrail-urile de trust/comercial;
- data reanalizei și criteriul de rollback.

Prioritizare recomandată:

1. **P0** — pierdere de date, securitate, indisponibilitate, recomandare fără rezultat
   pentru un segment semnificativ;
2. **P1** — scădere repetată a Recommendation Success Rate, abandon demonstrat,
   indexare blocată tehnic pe pagini eligibile;
3. **P2** — îmbunătățire editorială sau de conversie susținută de volum suficient;
4. **P3** — explorare fără semnal clar; rămâne în discovery, nu intră în build.

O modificare comercială nu poate schimba candidate generation, scorul sau ordinea
recomandării. CTR-ul retailerului optimizează doar prezentarea ofertelor după ce
cartea a fost aleasă.

## 8. Kill criteria pentru extinderi

Amână orice funcție majoră care nu demonstrează cel puțin una dintre următoarele:

- îmbunătățește alegerea următoarei cărți;
- crește încrederea prin explicații și proveniență;
- rezolvă un gol organic observat și susținut editorial;
- monetizează după recomandare fără a o influența.

Conturi publice, profiluri sociale, gamification, newsletter sau un ranker nou nu
intră automat în următorul sprint. Mai întâi se validează bucla centrală pe date
reale și se închid problemele P0/P1.
