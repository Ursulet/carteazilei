# Motorul de recomandare `recommendation-v1`

## Contractul produsului

Motorul transformă profilul anonim „Pentru mine” într-un snapshot cu maximum trei cărți. Selecția este deterministă, explicabilă și folosește exclusiv catalogul editorial publicat. Nu apelează un LLM și nu folosește popularitate, clickuri, prețuri, afiliere, comisioane, sponsorizări sau disponibilitate comercială.

Ordinea invariabilă este:

1. validează profilul de lectură;
2. construiește candidații editoriali;
3. elimină conflictele ferme;
4. calculează și persistă topul;
5. încarcă ofertele numai pentru cărțile deja alese.

## Eligibilitatea candidaților

O carte poate intra în scoring numai dacă:

- cartea și autorul sunt publicați și nu sunt șterși;
- încrederea editorială a cărții este cel puțin `60`;
- are verdict scurt, ediție activă, copertă validă și analiză editorială publicată;
- analiza are cel puțin o rezervă editorială reală pentru explicație;
- nu este chiar titlul ales ca referință;
- nu intră în conflict ferm cu deal-breakerele cititorului.

Taxonomiile sunt încărcate numai dacă sunt publicate/active. Relațiile față de cartea de referință sunt acceptate numai când sunt active, aprobate și au motiv public.

Ramura V1 „Pentru mine” nu cere vârsta. În consecință, nu inventează o audiență și nu activează ponderea de audiență. Când ramurile „Cadou” și „Pentru un copil” vor furniza vârstă/context validat, incompatibilitatea de audiență va putea deveni filtru ferm, iar ponderea rezervată va intra în normalizare.

## Scor și normalizare

Ponderile declarate ale versiunii sunt:

| Componentă | Pondere |
| --- | ---: |
| nevoie principală | 26 |
| gen | 16 |
| ritm | 12 |
| lungime | 8 |
| similaritate cu referința | 18 |
| audiență | 8 |
| încredere editorială | 8 |
| prospețime editorială | 4 |

Scorul se normalizează la suma componentelor disponibile. `Nu contează` dezactivează componenta respectivă. Dacă titlul de referință nu are graf editorial aprobat către candidați, ponderea de similaritate este scoasă din numitor; nu se fabrică similaritate din titlu, autor sau metadate comerciale. Audiența este tratată identic cât timp profilul nu are un semnal de vârstă.

Nevoia principală combină explicit mood-uri și trait-uri editoriale:

- captivare: `captivant` și `pace`;
- relaxare: `relaxant`, violență redusă și intensitate emoțională moderată;
- reflecție: `provocator`, `philosophical_depth` și `complexity`;
- învățare: `practical_density` și genuri non-ficționale controlate;
- emoție: `emotionant` și `emotional_intensity`;
- ieșire din rutină: `provocator`, `world_building` și `complexity`.

Trait-urile sunt ponderate și cu încrederea lor editorială. Scorul final este limitat la `0–100`; numai rezultatele cu minimum `35` rămân eligibile. Procentul nu este afișat public, deoarece nu este o probabilitate calibrată.

Un reason code pozitiv pentru nevoia principală este emis numai de la un fit intern de `0,45`; o contribuție mai slabă poate participa numeric la scor, dar nu este prezentată cititorului drept motiv demonstrat.

## Conflicte și penalizări

Un conflict ferm elimină candidatul numai când există un semnal editorial suficient de sigur. Pragurile V1 sunt:

- romance `≥ 70`;
- violență `≥ 65`;
- stare întunecată `≥ 70` sau teme editoriale grele controlate;
- ritm `≤ 30` pentru evitarea slow burn;
- complexitate `≥ 80` împreună cu densitate practică `≥ 65` pentru explicații tehnice;
- ambiguitate `≥ 70`.

Zonele moderate aplică penalizări explicite de `7–10` puncte și emit reason codes `SOFT_CONFLICT_*`. Evitarea demonstrabilă a unei limite poate emite reason codes `AVOID_*`. Semnalele absente nu sunt interpretate automat ca absența conținutului sensibil.

## Top 3 și explicația

Candidații sunt ordonați stabil după scor, încredere editorială și titlu. Se aleg maximum trei, preferând autori diferiți și genuri principale diferite. Constrângerea se relaxează progresiv când catalogul nu oferă destule opțiuni. Seria și subgenul nu există încă în modelul curent și nu sunt deduse din titlu.

Fiecare rezultat păstrează:

- versiunea `recommendation-v1`;
- scorul intern;
- rank-ul și reason codes tipate;
- un snapshot textual determinist cu exact trei motive și o rezervă editorială reală.

Etichetele publice sunt benzi descriptive:

- minimum `78`: `Potrivire excelentă`;
- minimum `62`: `Potrivire foarte bună`;
- alt rezultat eligibil: `Potrivire bună`.

Pagina prezintă întâi alegerea principală. Alternativele #2 și #3 apar numai la cererea cititorului, nu într-un grid simultan.

## Persistență, acces și SEO

Finalizarea quiz-ului generează rezultatele o singură dată. Reîncărcările folosesc snapshotul existent și nu schimbă ordinea dacă profilarea catalogului se modifică ulterior.

URL-ul `/recomanda-mi/rezultat/[opaque-token]` primește un capability token separat, derivat cu HMAC din tokenul HTTP-only al sesiunii. Baza de date păstrează numai HMAC-ul tokenului public. Tokenul nu conține PII și nu este reutilizat ca token de sesiune. Pagina este dinamică, `noindex`, `nofollow` și fără canonical tokenizat.

Migrația `0006_misty_jackal.sql` adaugă hashul unic al tokenului de rezultat în `recommendation_sessions`. Tabelele pentru rezultate și feedback existau deja în modelul inițial.

## Oferte și feedback

Ofertele sunt încărcate prin `listOffersForResolvedRecommendation` după citirea snapshotului de rezultat. Secțiunea „Unde o găsești” apare după motive, rezervă și CTA-ul către analiza completă. Trackingul comercial primește `recommendationResultId`, iar calea stocată este redacționată la `/recomanda-mi/rezultat`, fără capability token.

Feedbackul `positive`, `negative`, `started`, `finished` și nota `1–5` este validat, limitat ca rată și persistat separat. El nu recalculează și nu mută rezultatul curent. Reacțiile pozitivă/negativă sunt mutual exclusive; celelalte stări pot fi actualizate independent.

Dacă niciun candidat nu trece filtrele și pragul minim, pagina spune explicit că nu există încă o potrivire suficient de sigură. Nu afișează o alegere aleatorie.

## Verificări excluse

Nu au fost create sau rulate fixture-uri ori teste unitare, de integrare, E2E, accesibilitate sau QA, conform deciziei proprietarului proiectului. Implementarea este verificată numai prin typecheck, lint și build; testarea de comportament va fi făcută la deployment.
