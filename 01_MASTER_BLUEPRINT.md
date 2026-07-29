# 01 — Master Blueprint CarteaZilei 2.0

## 1. Viziune

CarteaZilei nu trebuie să concureze cu o librărie la volum și nici cu Goodreads la catalog.

Trebuie să dețină în mintea utilizatorului o întrebare:

> **„Ce carte să citesc acum?”**

Produsul trebuie să reducă alegerea, nu să mărească oferta.

### Poziționare

**Categorie:** book discovery / recommendation intelligence  
**Piață inițială:** România, limba română  
**Model de încredere:** editorial + personalizare explicabilă  
**Model comercial inițial:** afiliere transparentă  
**Moat:** relația `cititor × moment × preferințe × carte`, plus feedback după recomandare.

---

## 2. North Star

### Recommendation Success Rate

Procentul recomandărilor după care utilizatorul declară că recomandarea a fost potrivită.

Formula operațională:

`recomandări evaluate pozitiv / recomandări evaluate`

Nu optimizăm produsul pentru pageviews. Optimizăm pentru **alegeri bune**.

### KPI secundari

- quiz start rate;
- quiz completion rate;
- recommendation reveal rate;
- recommendation → book page;
- recommendation → save;
- recommendation → retailer click;
- „arată alternativa #2” rate;
- recommendation feedback score;
- return rate 7/30 zile;
- newsletter opt-in;
- trafic organic non-brand;
- pagini indexate eligibile;
- keyword clusters cu poziții Top 3 / Top 10;
- brand search growth.

---

## 3. Cele trei motoare

### A. Cartea Zilei — editorial

În fiecare zi există o singură alegere editorială principală.

Nu este aleatorie.

Înregistrarea editorială conține:
- data publicării;
- carte;
- editor;
- verdict;
- „de ce azi”;
- „pentru cine”;
- „nu este pentru tine dacă”;
- unghi editorial;
- status: draft / scheduled / published / archived.

URL:
- `/cartea-zilei`
- `/cartea-zilei/arhiva`
- `/cartea-zilei/2026-07-28`
- canonical-ul paginii zilei trebuie să fie pagina datată pentru persistență, iar `/cartea-zilei` funcționează ca intrare curentă.

### B. Recomandă-mi o carte — personalizare

Utilizatorul nu primește 20 de cărți.

Primește:

1. **Alegerea noastră pentru tine**
2. motivarea clară;
3. posibile deal-breakers;
4. o alternativă #2 la cerere;
5. eventual alternativa #3 dacă respinge din nou.

Recomandarea nu trebuie să simtă ca un filtru de catalog.

Trebuie să simtă ca un librar foarte bun care spune:

> „Din ce mi-ai spus, eu aș începe cu aceasta.”

### C. Book Intelligence — SEO + validare

Fiecare carte importantă are o pagină care răspunde real la decizie.

Nu copiem sinopsisul editorului.

Pagina trebuie să poată câștiga căutări precum:
- `[titlu] păreri`;
- `[titlu] recenzie`;
- `merită citită [titlu]`;
- `despre ce este [titlu]`;
- `cărți asemănătoare cu [titlu]`;
- `ce să citesc după [titlu]`.

---

## 4. Segmente de utilizatori

### Explorer
Nu știe ce vrea și caută inspirație.

Intrare ideală: homepage → quiz.

### Intent-driven reader
Știe ce stare / tip de lectură caută.

Intrare ideală: pagină SEO de intenție → recomandări curate → quiz refinat.

### Validator
A auzit de o carte și vrea să afle dacă merită.

Intrare ideală: Google → pagina cărții.

### Gift buyer
Vrea o carte pentru altcineva.

Intrare ideală: quiz ramificat „Cadou”.

### Parent
Alege pentru copil.

Intrare ideală: quiz „Pentru copil” + pagini pe vârstă.

---

## 5. Regula de aur a UX

**Orice pagină trebuie să răspundă în mai puțin de 10 secunde la:**
1. unde sunt;
2. ce valoare primesc;
3. de ce să am încredere;
4. care este următorul pas.

---

## 6. Homepage — arhitectura finală

### 6.1 Header

Desktop:
- Logo / wordmark Cartea Zilei;
- `Cărți`;
- `Recomandări`;
- `Autori`;
- `Liste`;
- `Despre`;
- search icon / search field;
- CTA: `Recomandă-mi o carte`.

Mobile:
- logo;
- search;
- CTA compact;
- menu sheet.

### 6.2 Hero

Eyebrow:
`RECOMANDĂRI DE CARTE, NU LISTE INTERMINABILE`

H1:
**Ce carte merită timpul tău?**

Body:
`Spune-ne ce cauți, ce stare ai și ce ți-a plăcut până acum. Cartea Zilei îți recomandă o singură alegere principală și îți explică de ce.`

Primary CTA:
`Recomandă-mi o carte`

Secondary:
`Vezi Cartea Zilei`

Search:
`Caută o carte, un autor sau o temă`

Trust microcopy:
`Recomandări explicate · selecție editorială · afiliere transparentă`

### 6.3 Cartea Zilei

Titlu secțiune:
**Alegerea editorială de astăzi**

Conținut:
- copertă;
- dată;
- titlu + autor;
- verdict de 2–3 fraze;
- „O vei aprecia dacă” — 3 puncte;
- „Probabil nu este pentru tine dacă” — 1–2 puncte;
- editor + link metodologie;
- CTA `Vezi analiza`;
- secundar `Vezi unde o găsești`.

Nu folosim copy `CUMPĂRĂ ACUM` dacă redirecționăm extern.

### 6.4 Quiz conversion block

H2:
**Nu știi ce să citești?**

Copy:
`Răspunde la câteva întrebări. Noi alegem una.`

CTA:
`Găsește-mi cartea`

Microcopy:
`2–3 minute · fără cont obligatoriu`

### 6.5 Discovery by need

H2:
**Ce ai nevoie de la următoarea carte?**

Carduri:
- Să mă captiveze
- Să mă relaxeze
- Să mă facă să gândesc
- Să învăț ceva
- Să mă emoționeze
- Să mă scoată din rutină

Fiecare conduce către un hub SEO relevant.

### 6.6 SEO hubs

H2:
**Explorează după ce cauți**

Grupe:
- gen;
- stare;
- lungime;
- audiență;
- ocazie;
- autori.

### 6.7 „Ce să citești după…”

Carousel/listă editorială cu titluri populare:
- `Ce să citești după Dune`
- `Ce să citești după Atomic Habits`
- etc.

### 6.8 Liste editoriale

3–6 materiale:
- cele mai bune cărți de…
- cărți scurte care…
- cărți pentru…

### 6.9 Trust / Methodology

H2:
**Cum alegem cărțile**

3 principii:
- evaluare editorială;
- potrivire, nu popularitate;
- monetizarea nu schimbă recomandarea.

CTA:
`Vezi metodologia`

### 6.10 Newsletter

**O recomandare bună. O dată pe săptămână.**

Fără newsletter în V1 tehnic dacă nu este gata operațional; secțiunea se activează doar când fluxul de email este funcțional și GDPR-compliant.

---

## 7. Pagina de carte

URL:
`/carte/[slug]`

### Above the fold

- breadcrumbs;
- copertă;
- titlu;
- autor;
- metadata esențiale;
- verdict Cartea Zilei;
- CTA `Vreau să o citesc`;
- CTA secundar `Vezi unde o găsești`.

### Secțiuni obligatorii

1. Verdict în 30 de secunde
2. Merită să o citești dacă…
3. Poate să nu fie pentru tine dacă…
4. Despre ce este, fără spoilere
5. Temele principale
6. Profil de lectură:
   - ritm;
   - complexitate;
   - încărcătură emoțională;
   - lungime;
   - world-building;
   - romance level;
7. Ce ne-a plăcut
8. Ce poate diviza cititorii
9. Pentru cine o recomandăm
10. Cărți similare + explicația relației
11. Ce să citești după
12. Despre autor
13. Ofertă / retailer links
14. Surse / ediție / ISBN
15. Disclosure afiliere
16. Feedback: `Ai citit-o?`

### Regula editorială

Nicio pagină nu poate fi publicată dacă are:
- sinopsis copiat;
- verdict generic;
- relații similare fără explicație;
- review artificial;
- rating fără proveniență.

---

## 8. Pagina autorului

URL:
`/autor/[slug]`

Conținut:
- nume;
- bio editorială;
- date verificate;
- cărți analizate;
- de unde să începi cu autorul;
- ordinea recomandată de lectură, dacă este relevantă;
- liste în care apare;
- surse.

---

## 9. Arhiva Cartea Zilei

URL:
`/cartea-zilei/arhiva`

Filtre:
- lună;
- an;
- gen;
- editor.

Cardul din arhivă:
- data;
- copertă;
- titlu;
- autor;
- motivul principal într-o propoziție.

Pagini datate:
`/cartea-zilei/YYYY-MM-DD`

Aceste pagini sunt indexabile doar dacă au conținut editorial suficient și unic.

---

## 10. Modelul de conținut editorial

### Verdict
50–100 cuvinte, original.

### De ce recomandăm
3–5 argumente concrete.

### Contra / deal-breaker
cel puțin un punct sincer.

### Relație între cărți
Nu este suficient `same genre`.

Exemplu de relationship reason:
`Similară prin world-building amplu și conflict politic, dar mai puțin orientată spre introspecție.`

### Autor editorial
Fiecare analiză are autor/editor real și pagină de profil.

---

## 11. Brand voice

### Caracter
- calm;
- informat;
- precis;
- selectiv;
- uman;
- fără hiperbole de vânzare.

### Evităm
- „carte extraordinară pe care trebuie să o citești”;
- „te va schimba pe viață”;
- texte tip afiliere agresivă;
- superlative fără argument;
- review-uri neatribuite.

### Preferăm
- „o recomandăm dacă…”;
- „nu este alegerea potrivită dacă…”;
- „punctul ei forte este…”;
- „cititorii care preferă X ar putea găsi Y frustrant”.

---

## 12. Trust architecture

Pagini obligatorii:
- `/despre`
- `/cum-recomandam`
- `/echipa`
- `/editor/[slug]`
- `/politica-editoriala`
- `/afiliere`
- `/contact`

Principiu:
**Afilierea monetizează decizia, nu o dictează.**

Orice plasare plătită trebuie marcată `Promovat` și separată vizual de recomandarea editorială.

---

## 13. Ce păstrăm din produsul vechi

- ideea de quiz;
- baza de cărți;
- autori;
- upload media;
- structură admin ca punct de pornire;
- câmpurile genres/themes/moods;
- slug-uri;
- date SEO care sunt curate;
- istoric dacă este verificabil.

### Ce nu migrăm automat

- testimoniale nereconfirmate;
- review-uri cu identitate sau sursă incertă;
- structured data introdus manual fără audit;
- copy copiat de la retailer/editură;
- setarea random pentru Cartea Zilei.

---

## 14. Principiu de lansare

Nu lansăm mii de pagini subțiri.

Lansăm un nucleu de calitate:
- 100–300 pagini de carte bune;
- 20–50 autori;
- 30–60 hub-uri de intenție;
- 20–40 materiale „ce să citești după”;
- o arhivă Cartea Zilei autentică de la data relansării.

Calitatea editorială precede volumul.
