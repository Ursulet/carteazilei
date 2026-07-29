# Contractul de date pentru scraperul de cărți

Scraperul exportă JSON UTF-8 conform [`book-scrape.schema.json`](./book-scrape.schema.json).
Un exemplu complet este în [`book-scrape.example.json`](./book-scrape.example.json).

## Principiul de siguranță editorială

Scraperul colectează fapte despre carte, ediție și ofertă. Nu produce verdictul
CarteaZilei, argumentele recomandării, scorurile de recomandare sau o plasare
comercială. Acestea rămân decizii editoriale ori comerciale explicite în admin.

La import:

- autorii și cărțile noi intră cu status `needs_review`;
- SEO rămâne neindexabil;
- ofertele intră inactive;
- categoriile mapate sunt numai propuneri de revizuit;
- sinopsisul sursă nu devine automat text editorial public;
- nicio carte nu devine automat Cartea Zilei.

## Câmpurile care trebuie colectate

### Identitate și proveniență

| Câmp | Obligatoriu | Regula |
| --- | --- | --- |
| `sourceSystem` | da | cod stabil al scraperului, de exemplu `libris` |
| `book.externalId` | da | ID stabil al produsului în sursă; nu un index de listă |
| `book.sourceUrl` | da | pagina exactă a cărții, HTTPS |
| `book.scrapedAt` | da | dată ISO 8601 în UTC |
| `edition.externalId` | da | SKU/ID ediție sau un ID derivat stabil din ISBN |
| `offer.checkedAt` | da | momentul la care au fost citite prețul și stocul |

`externalId` nu se schimbă între rulări. Exemple bune: `libris:123456`,
`nemira:sku-987`. Titlul și poziția produsului într-o pagină nu sunt ID-uri stabile.

### Carte și persoane

- `title`: obligatoriu, maximum 300 de caractere;
- `subtitle` și `originalTitle`: opționale;
- `authors`: minimum o persoană și exact una cu `primary: true`;
- `role`: `author`, `editor`, `translator`, `illustrator` sau `contributor`;
- biografia este opțională și trebuie însoțită de URL-ul sursei.

Modelul actual CarteaZilei folosește un autor principal. Scraperul păstrează și
ceilalți contributori pentru reconciliere și o extindere ulterioară a catalogului.

### Ediție

Colectează când există:

- ISBN-13 fără spații și cratime;
- ISBN-10 fără spații și cratime, cu `X` mare dacă este cazul;
- editura;
- anul și/sau data publicării;
- limba (`ro`, `en`, `ro-RO`);
- numărul de pagini;
- eticheta ediției și formatul comercial.

ISBN-ul este identificatorul principal pentru deduplicare, dar nu este obligatoriu:
unele produse digitale sau ediții vechi nu îl publică.

### Copertă și text-sursă

Pentru copertă se păstrează URL-ul imaginii, pagina-sursă, textul alternativ,
atribuirea și situația drepturilor. Valorile pentru `rightsStatus` sunt:

- `unknown`;
- `publisher_supplied`;
- `licensed`;
- `owned`.

Nu declara `licensed` sau `owned` doar pentru că imaginea este public accesibilă.
Importatorul va descărca și valida separat imaginea înainte de stocarea prin adaptorul media configurat.

Sinopsisul scrape-uit se salvează în `sourceContent`, împreună cu sursa și drepturile.
Nu se scrape-uiesc și nu se publică automat recenzii, verdicturi ori texte editoriale
ale altor site-uri.

### Taxonomii

`sourceCategories` păstrează etichetele exact cum apar pe site-ul sursă.
`classificationCandidates` conține numai sluguri controlate CarteaZilei.

Nu deduce automat teme, stări sau public din preț, popularitate ori partener.
Dacă mappingul nu este sigur, păstrează categoria brută și lasă lista controlată goală.

### Oferte comerciale

Pentru fiecare ofertă colectează:

| Câmp | Exemplu |
| --- | --- |
| `partnerExternalId` | `partner:libris` |
| `purchaseUrl` | URL-ul exact al produsului |
| `sourceSku` | SKU-ul magazinului |
| `price` | `59.90`, ca string cu punct |
| `listPrice` | prețul vechi/listă, opțional |
| `currency` | `RON`, cod ISO cu trei litere |
| `availability` | `in_stock`, `out_of_stock`, `preorder`, `unknown` |
| `stockText` | textul brut, de exemplu `În stoc furnizor` |
| `checkedAt` | moment ISO 8601 UTC |

Scraperul folosește în mod normal:

```json
{
  "affiliateMode": "inherit",
  "commercialPlacement": "none"
}
```

Statutul afiliat vine din configurația partenerului. `promoted` și
`commercial_partnership` se setează numai când există o decizie comercială reală,
nu se deduc din pagina produsului. Prețul și partenerul nu sunt introduse în
scorurile de recomandare.

## Normalizare înainte de export

1. Elimină spațiile și cratimele din ISBN.
2. Scrie prețurile ca string zecimal cu punct, fără `lei` și fără separator de mii.
3. Folosește codul `RON`, nu `lei`.
4. Transformă stocul sursei în unul dintre cele patru coduri acceptate și păstrează
   textul original în `stockText`.
5. Păstrează URL-uri HTTPS absolute; nu exporta linkuri relative.
6. Normalizează spațiile din titluri, dar nu schimba diacriticele.
7. Nu genera slugul final al cărții; importatorul îl generează și verifică duplicatele.
8. Nu elimina parametrii afiliați legitimi din `purchaseUrl`; elimină numai parametrii
   de sesiune sau tracking care se schimbă la fiecare acces.

## Deduplicare planificată la import

Ordinea de identificare este:

1. `sourceSystem + externalId` pentru aceeași sursă;
2. ISBN-13;
3. ISBN-10;
4. titlu normalizat + autor principal + editură;
5. altfel, înregistrare nouă cu `needs_review`.

O ofertă este unică prin ediție + partener + URL de achiziție. O re-rulare identică
nu trebuie să creeze duplicate. O schimbare de preț sau stoc devine actualizare a
ofertei, cu un nou `checkedAt`.

## Ce nu trebuie pus în exportul scraperului

- `shortVerdict`, `whyRead`, `whyNot`, `strengths`, `caveats`;
- scoruri de ritm, complexitate sau preferințe;
- `isPrimary` ales în funcție de comision ori preț;
- status `published`;
- selecția Cartea Zilei;
- texte de recenzie copiate de pe alte site-uri;
- clickuri, ratinguri sau popularitate ca semnal editorial.

Aceste câmpuri sunt completate ori aprobate în fluxul editorial CarteaZilei.
