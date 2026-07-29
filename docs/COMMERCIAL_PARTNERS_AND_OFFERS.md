# Parteneri comerciali, oferte și tracking

## Rolul feature-ului

Stratul comercial extinde natural recomandarea editorială:

1. CarteaZilei alege și explică o carte;
2. abia după alegere sunt încărcate ofertele active ale cărții;
3. cititorul vede unde poate găsi ediția recomandată.

Nicio coloană din `retailers`, `book_offers`, evenimentele comerciale sau rapoartele de click nu este folosită de selecția ori scorul recomandărilor. Helperul `listOffersForResolvedRecommendation` este apelat de pagina personalizată numai după citirea rezultatului deja stabilit și persistat.

## Administrare

Zona „Parteneri comerciali” este accesibilă administratorilor și gestionează:

- numele, slugul și tipul: editură, librărie, marketplace sau distribuitor;
- logo ales din biblioteca Media;
- website HTTPS și CTA implicit;
- status activ/inactiv;
- afiliere și existența unui parteneriat comercial, ca stări distincte;
- disclosure opțional specific partenerului.

Exemplele din brief nu sunt introduse automat. Nu sunt create logo-uri, relații comerciale sau afilieri fictive.

În fișa unei cărți, administratorul are ruta separată „Oferte & afiliere”. Fluxul uzual cere doar:

`Partener → URL exact → Preț → Salvează`

Setările avansate sunt pliate și includ moneda, disponibilitatea, moștenirea afilierii, oferta principală, ordinea, CTA-ul, statusul și tipul plasării comerciale. O carte are maximum o ofertă principală activă pentru ediția activă.

## Cartea Zilei și paginile publice

O selecție zilnică poate indica explicit o ofertă principală. Serviciul verifică faptul că oferta:

- este activă;
- aparține unei ediții active;
- are un partener activ;
- aparține chiar cărții selectate pentru ziua respectivă.

Dacă oferta explicită devine indisponibilă, interfața revine la oferta principală a cărții. Oferta principală este afișată prima, urmată de „Alte opțiuni”. Secțiunea „Unde o găsești” este plasată după analiza editorială pe pagina cărții și în articolul Cartea Zilei. Homepage-ul afișează numai opțiunea principală lângă selecția zilei.

Prețul public este afișat numai când a fost verificat în ultimele 24 de ore, are monedă și oferta nu este marcată fără stoc. Prețul și disponibilitatea finală rămân cele ale partenerului.

## Afiliere și sponsorizare

Afilierea este o proprietate a linkului și poate fi moștenită de la partener. Sponsorizarea este o proprietate separată a plasării și poate avea una dintre valorile:

- fără sponsorizare;
- `Promovat`;
- `Parteneriat comercial`.

Plasările comerciale sunt etichetate vizibil. Linkurile afiliate ori sponsorizate folosesc `rel="sponsored nofollow noopener"`. Disclosure-ul explică posibilul comision, lipsa costului suplimentar și faptul că afilierea nu influențează recomandarea editorială.

## Tracking și raportare

Linkurile publice nu expun URL-ul extern direct. Ele trec prin `/go/oferta/[offerId]`, unde serverul derivă din baza de date:

- cartea;
- partenerul;
- oferta;
- URL-ul extern.

Contextul este validat înainte de înregistrare. Pentru Cartea Zilei, selecția trebuie să fie publicată și să indice aceeași carte. Pentru recomandări, rezultatul trebuie să indice aceeași carte. Sunt păstrate calea-sursă, contextul și data evenimentului; nu sunt colectate IP-ul, user-agentul sau fingerprinturi.

CTR-ul necesită un numitor, de aceea sunt persistate separat afișările ofertelor printr-un apel client-side după randare. Admin-ul arată momentan:

- clickuri și afișări totale;
- CTR pentru pagini de carte, Cartea Zilei și recomandări personalizate;
- cărțile și partenerii cu cele mai multe clickuri;
- clickuri, afișări și CTR per ofertă.

Valorile sunt brute și pot include boți. Filtrarea traficului automat, ferestrele temporale configurabile și exporturile aparțin fazei complete de analytics.

## Migrare și verificări

Migrația `0004_ambitious_grey_gargoyle.sql` adaugă câmpurile comerciale, oferta principală zilnică și tabelele de click/afișare cu indexurile necesare.

Au fost rulate numai verificări statice și build. Nu au fost create sau rulate teste unitare, de integrare, E2E, accesibilitate ori QA, conform deciziei proprietarului proiectului.
