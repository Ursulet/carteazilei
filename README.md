# CarteaZilei.ro — Master Blueprint & Developer Prompts

Versiune: 1.0  
Data arhitecturii: 2026-07-28  
Scop: reconstrucția CarteaZilei.ro ca brand și autoritate românească în recomandări de cărți.

## Definiția produsului

**CarteaZilei.ro este o platformă românească de descoperire și recomandare de cărți care ajută cititorii să aleagă următoarea lectură prin recomandări personalizate, analiză editorială și selecția zilnică „Cartea Zilei”.**

Promisiune:

> **Spune-ne ce cauți. Noi alegem cartea.**

Mesaje suport:
- **Nu 100 de recomandări. Una bună.**
- **Recomandări explicate. Mai puține titluri. Alegeri mai bune.**
- **Următoarea carte bună începe aici.**

## Cele 3 motoare ale produsului

1. **Cartea Zilei** — alegere editorială zilnică, argumentată și arhivată.
2. **Recomandă-mi o carte** — motor personalizat care întoarce o alegere principală, nu un catalog.
3. **Book Intelligence** — pagini editoriale SEO care răspund la „Merită?”, „Pentru cine este?”, „Ce citesc după?”, „Ce cărți seamănă cu…?”.

## Ordinea documentelor

1. `01_MASTER_BLUEPRINT.md`
2. `02_SEO_INFORMATION_ARCHITECTURE.md`
3. `03_RECOMMENDATION_ENGINE.md`
4. `04_DATA_MODEL_AND_ADMIN.md`
5. `05_DESIGN_SYSTEM_AND_UX.md`
6. `06_TECHNICAL_ARCHITECTURE_AND_COOLIFY.md`
7. `07_ANALYTICS_TRUST_MONETIZATION.md`
8. `08_MIGRATION_AND_ROADMAP.md`
9. `09_ACCEPTANCE_CRITERIA.md`
10. `prompts/` — prompturile de execuție pentru Developer Agent, în ordinea numerică.

## Regula de lucru cu Developer Agent

Nu îi da toate prompturile simultan. Rulează-le pe rând.

La finalul fiecărui prompt, agentul trebuie:
1. să ruleze typecheck/lint/build; testele și QA-ul sunt amânate la deployment prin decizia proprietarului;
2. să listeze fișierele modificate;
3. să raporteze deciziile și deviațiile;
4. să nu înceapă etapa următoare până nu primește aprobarea.

## Ce NU construim în prima versiune

- social network;
- feed public;
- chat între cititori;
- aplicație mobilă;
- PWA;
- gamification amplă;
- traduceri;
- chatbot AI generalist;
- recomandare bazată exclusiv pe LLM;
- checkout propriu.

Primul obiectiv este să devenim **cei mai buni la alegerea următoarei cărți**.

## Documentația implementării

Deciziile tehnice livrate sunt documentate în `docs/`. Pentru canonicale, crawl control, sitemap, JSON-LD, social cards, redirecturile legacy și checklistul de lansare, vezi [`docs/TECHNICAL_SEO.md`](docs/TECHNICAL_SEO.md). Pentru pipeline-ul idempotent de migrare și carantina recenziilor, vezi [`docs/LEGACY_IMPORT_AND_QUARANTINE.md`](docs/LEGACY_IMPORT_AND_QUARANTINE.md).

Verdictul curent și porțile care trebuie validate în mediul final sunt menținute în [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md). Configurația Coolify, migrațiile one-off, backupul, restaurarea și rollbackul sunt descrise în [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Țintele editoriale, dashboardul și ritmul operațional de după lansare sunt definite în [`docs/LAUNCH_CONTENT_30_DAY_PLAN.md`](docs/LAUNCH_CONTENT_30_DAY_PLAN.md).
