# 02 — SEO & Information Architecture Blueprint

## 1. Obiectiv SEO

CarteaZilei trebuie să captureze 4 tipuri de intenție:

1. **Discovery:** „cărți de citit”, „cărți care te fac să gândești”.
2. **Evaluation:** „Dune păreri”, „merită Atomic Habits”.
3. **Similarity:** „cărți asemănătoare cu Dune”.
4. **Continuation:** „ce să citesc după 1984”.

Nu urmărim doar keyword volume. Urmărim **apropierea de decizie**.

---

## 2. Sitemap public recomandat

```text
/
├── /recomanda-mi
├── /cartea-zilei
│   ├── /arhiva
│   └── /YYYY-MM-DD
├── /carte/[slug]
├── /autor/[slug]
├── /editor/[slug]
├── /carti
│   ├── /gen/[slug]
│   ├── /tema/[slug]
│   ├── /stare/[slug]
│   ├── /pentru/[slug]
│   ├── /lungime/[slug]
│   └── /nivel/[slug]
├── /carti-asemanatoare-cu/[book-slug]
├── /ce-sa-citesc-dupa/[book-slug]
├── /liste/[slug]
├── /ghiduri/[slug]
├── /cauta
├── /despre
├── /cum-recomandam
├── /politica-editoriala
├── /afiliere
├── /echipa
├── /contact
└── /legal/*
```

Admin:
`/admin/*` — noindex, auth-protected.

Quiz result:
`/recomanda-mi/rezultat/[token]` — `noindex` implicit, pentru a evita pagini personale / thin / duplicate.

---

## 3. Regula de indexare

O pagină poate fi indexabilă numai dacă:
- are intenție de căutare distinctă;
- are conținut unic;
- are minimum de valoare editorială;
- nu este doar o combinație de filtre;
- este linkată intern contextual;
- are canonical corect;
- nu are date insuficiente.

### Noindex implicit

- pagini de search intern;
- filtre query-string;
- rezultate quiz;
- pagini admin/auth;
- draft/preview;
- combinații de filtre fără landing editorial.

---

## 4. Taxonomie controlată

Taxonomiile sunt entități editoriale, nu free-text arbitrar.

### Genres
Exemple:
- ficțiune;
- fantasy;
- science fiction;
- thriller;
- crime;
- romance;
- istorie;
- business;
- psihologie;
- dezvoltare personală;
- parenting;
- memorii.

### Themes
- sens;
- identitate;
- putere;
- familie;
- doliu;
- leadership;
- productivitate;
- anxietate etc.

### Moods / needs
- captivant;
- relaxant;
- emoționant;
- provocator;
- optimist;
- întunecat;
- inspirațional.

### Reading traits
- pace;
- complexity;
- emotional intensity;
- romance;
- violence;
- world building;
- philosophical depth;
- humor;
- practical density.

Fiecare taxonomie are:
- `name`;
- `slug`;
- `description`;
- `search_intent`;
- `indexable`;
- `seo_title`;
- `seo_description`;
- editorial intro;
- FAQ doar dacă este autentic.

---

## 5. Pagini SEO programatice, dar editoriale

### Exemplu
`/carti/stare/care-te-fac-sa-gandesti`

Nu genera:
> „Descoperă cele mai bune cărți care te fac să gândești…”

Generează editorial:
- ce înțelegem prin categorie;
- criteriile selecției;
- 7–12 titluri curate;
- de ce fiecare este în listă;
- pentru cine este;
- diferențe între recomandări;
- update date;
- editor.

### Prag de indexare
Hub-ul rămâne draft/noindex până când are:
- cel puțin 5 titluri evaluate;
- minimum 350–500 cuvinte editoriale utile;
- editor;
- relații interne relevante.

Nu folosi pragul ca „truc SEO”; este un prag intern de calitate.

---

## 6. Template SEO — carte

### Title
`[Titlu] de [Autor] — Merită citită? | Cartea Zilei`

Variante bazate pe intent, fără keyword stuffing.

### Meta description
Verdict clar, nu o enumerare de keywords.

### H1
Titlul cărții.

### Canonical
`https://carteazilei.ro/carte/[slug]`

### Structured data
Schema relevantă:
- `Book`
- `BreadcrumbList`
- `Person` pentru autor când este potrivit;
- `Review` / `AggregateRating` doar dacă datele respectă criteriile reale și vizibile.

Nu marca rating-uri inventate sau agregări inexistente.

### Edition awareness
Work și edition trebuie diferențiate:
- cartea conceptuală;
- ediție;
- ISBN;
- publisher;
- language;
- page count.

---

## 7. Template — „ce să citesc după”

URL:
`/ce-sa-citesc-dupa/[slug]`

H1:
`Ce să citești după „[Titlu]”`

Intro:
explică *ce* poate căuta un cititor care a iubit cartea.

Segmente:
- dacă ți-a plăcut lumea;
- dacă ți-a plăcut stilul;
- dacă ți-a plăcut tema;
- dacă vrei ceva mai ușor/mai intens.

Fiecare recomandare are reason code editorial.

Această pagină nu trebuie să fie duplicat al blocului „similar books” de pe pagina principală a cărții.

---

## 8. Internal linking

### De pe carte
link către:
- autor;
- gen;
- 1–3 teme;
- 1–2 hubs de nevoie;
- similar;
- ce citești după;
- liste editoriale relevante.

### De pe autor
link către:
- cărți;
- „de unde să începi”;
- liste relevante.

### De pe hub
link către:
- cărți;
- hubs apropiate, doar contextual;
- quiz cu răspunsuri prepopulate, unde are sens.

Anchor text trebuie să descrie destinația, nu `click aici`.

---

## 9. Sitemap tehnic

Folosește Next.js metadata routes.

Sitemap separat logic dacă volumul crește:
- books sitemap;
- authors sitemap;
- editorial sitemap;
- hubs sitemap.

Include doar URL-uri canonice și indexabile.

`lastModified` trebuie să reflecte modificări editoriale reale, nu fiecare deploy.

---

## 10. Robots

Permite conținutul public.

Blochează crawl inutil:
- `/admin/`
- `/api/` unde nu este necesar;
- preview routes;
- auth.

Nu folosi robots.txt ca înlocuitor pentru noindex acolo unde trebuie ca pagina să fie accesibilă crawlerului pentru a vedea noindex.

---

## 11. Metadata

Toate paginile publice trebuie să aibă:
- title unic;
- description;
- canonical;
- Open Graph;
- Twitter metadata;
- imagini OG generate dinamic pentru paginile mari;
- semantic heading hierarchy.

---

## 12. JSON-LD security

JSON-LD este generat server-side din date validate.

La serializare:
- sanitizare pentru caractere periculoase;
- niciun câmp HTML brut din admin nu ajunge nefiltrat în JSON-LD;
- schema este derivată din modelul de date, nu copy-paste liber.

---

## 13. Content quality

### Fiecare pagină de carte trebuie să demonstreze:
- experiență editorială;
- analiză proprie;
- atribuire;
- data ultimei revizuiri;
- surse bibliografice pentru date factuale;
- delimitare între opinie și date.

### Nu publicăm:
- AI text nevalidat;
- sinopsisuri rescrise mecanic;
- pagini create doar pentru combinații de keywords;
- review-uri fabricate;
- prețuri stale prezentate ca actuale.

---

## 14. Search intent map inițial

### Tier A — decizie puternică
- `[titlu] păreri`
- `[titlu] recenzie`
- `merită [titlu]`
- `ce să citesc după [titlu]`
- `cărți asemănătoare cu [titlu]`

### Tier B — discovery
- `cărți de citit`
- `cărți recomandate`
- `cele mai bune cărți [gen]`
- `cărți pentru [audiență]`

### Tier C — context / mood
- `cărți scurte`
- `cărți ușor de citit`
- `cărți care te motivează`
- `cărți care te fac să plângi`
- `cărți care te fac să gândești`

Lansarea trebuie să combine A + B + C.

---

## 15. Technical SEO gates în CI

Build-ul trebuie să poată verifica:
- un singur H1 pe template;
- canonical valid;
- no accidental `noindex` pe public;
- sitemap generation;
- robots;
- 404 real;
- redirect map;
- structured data serializabil;
- links interne fără `javascript:` și fără URLs invalide.

Nu încerca validarea completă Google Rich Results offline; include o checklist manuală post-deploy.
