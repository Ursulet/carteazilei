# 08 — Migration & Roadmap

## 1. Strategie

Nu rescrie live site-ul peste producție.

Construiește CarteaZilei 2.0 separat:
- repo nou;
- DB nouă/staging;
- import;
- QA;
- cutover.

---

## 2. Audit sursă

Din produsul vechi avem:
- books;
- authors;
- reviews;
- display settings;
- site settings;
- quiz metadata;
- media.

Exportă datele în JSON/CSV controlat.

---

## 3. Curățare înainte de import

### Books
- normalize title;
- slug;
- author mapping;
- duplicate detection;
- cover provenance;
- purchase URL;
- taxonomy mapping.

### Reviews
Status implicit: `quarantined`.

Publică doar după verificarea:
- sursei;
- identității;
- textului;
- atribuirii.

### Daily feature history
Nu inventa retroactiv arhivă.

Dacă istoricul vechi nu este real și documentat, arhiva nouă începe la relansare.

---

## 4. URL migration

Creează mapping:
`old_url → new_url`.

301 pentru pagini mutate relevant.

Nu redirecta orice 404 la homepage.

---

## 5. Roadmap

### Phase 0 — Foundation
- repo;
- stack;
- database;
- Docker;
- auth;
- design tokens;
- CI.

### Phase 1 — Editorial core
- books;
- editions;
- authors;
- editors;
- admin;
- publish workflow.

### Phase 2 — Public core
- homepage;
- Cartea Zilei;
- archive;
- book page;
- author page.

### Phase 3 — Recommendation
- quiz;
- deterministic score;
- result;
- alternatives;
- feedback.

### Phase 4 — SEO engine
- hubs;
- lists;
- similar;
- next-read;
- sitemap;
- JSON-LD;
- OG.

### Phase 5 — Migration
- data import;
- redirects;
- content QA.

### Phase 6 — Production launch
- Coolify;
- backup;
- analytics;
- Search Console;
- monitoring.

---

## 6. Conținut înainte de launch

Minimum recomandat:
- 100 cărți cu pagină completă;
- 20 autori;
- 20 daily features programate/planificate editorial;
- 20 hubs/liste cu valoare;
- 10 „ce să citești după” pentru titluri puternice;
- metodologie;
- echipă/editori;
- afiliere.

Nu bloca tehnic lansarea dacă volumele exacte diferă, dar nu lansa un produs care pare gol.

---

## 7. Primele 90 zile după launch

### 0–30
- indexation audit;
- fix crawl/canonical;
- recommendation feedback;
- zero-result analysis;
- improve top 30 book pages.

### 31–60
- 2–4 SEO hubs/săptămână;
- 3–5 book pages/săptămână;
- optimize recommendation weights;
- launch newsletter dacă operațional.

### 61–90
- similarity graph;
- next-read expansion;
- account/taste profile discovery, doar dacă feedback-ul justifică.

---

## 8. Kill criteria pentru features

Nu construim o funcție dacă:
- nu susține discovery;
- nu crește trust;
- nu îmbunătățește recommendation success;
- nu creează organic authority;
- sau nu monetizează fără să afecteze trust-ul.

Acest filtru ține produsul concentrat.
