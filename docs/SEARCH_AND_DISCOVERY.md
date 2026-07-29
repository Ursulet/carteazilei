# Căutare și discovery public

## Contract public

Căutarea are două suprafețe care folosesc același query helper:

- panoul accesibil din header, alimentat de `GET /api/search?q=...`;
- pagina completă `/cauta?q=...`, marcată `noindex, follow` și exclusă din sitemap.

Rezultatele sunt grupate în `Cărți`, `Autori` și `Liste / ghiduri`. Un termen tematic poate găsi cărți prin taxonomiile editoriale asociate; nu există o categorie publică artificială doar pentru a umple interfața.

## Relevanță

Ordinea de bază pentru cărți este explicită și deterministă:

1. titlu exact — bază `1000`;
2. prefix de titlu — bază `800`;
3. autor exact — bază `650`;
4. prefix de autor — bază `600`;
5. similaritate trigram a titlului — maximum `200`;
6. full-text și potriviri de autor aproximative — semnale secundare;
7. gen, temă, stare și audiență — maximum `24`, fără puterea de a depăși potrivirile nominale.

Normalizarea se face în PostgreSQL cu `lower` și `unaccent`. Similaritatea folosește `pg_trgm`, iar documentul cărții folosește `tsvector`. Asta permite căutări fără diacritice și toleranță la erori mici, fără cluster extern.

Căutarea nu modifică motorul de recomandare și nu folosește prețul, partenerul, afilierea sau sponsorizarea ca semnale de relevanță.

## Calitatea rezultatelor

- O carte apare numai dacă are pagină publică eligibilă: autor public, ediție și copertă validate, rezumat, verdict și rezervă editorială.
- Un autor apare numai dacă are cel puțin o carte publică eligibilă.
- O listă sau un ghid apare numai dacă este public, indexabil, are editor, introducere, metodologie, metadate SEO și numărul minim de selecții publice explicate.
- Starea fără rezultate oferă quiz-ul și hub-uri editoriale publicate. Nu sunt fabricate interogări, trenduri sau popularitate.

## Protecții și performanță

- minimum 2 și maximum 100 de caractere;
- inputul este interpolat de Drizzle exclusiv ca parametri SQL;
- `statement_timeout` local de 900 ms pentru tranzacția de căutare;
- debounce de 250 ms și anularea cererii precedente în panoul din header;
- maximum 40 de cereri pe minut per identitate, cu blocare persistentă pentru endpointul rapid;
- răspunsurile API au `Cache-Control: no-store` și `X-Robots-Tag: noindex, nofollow`;
- răspunsurile cu eroare nu expun mesaje sau detalii PostgreSQL.

## Accesibilitate

Panoul folosește dialogul Radix pentru focus trap, închidere cu `Escape` și întoarcerea focusului la butonul declanșator. Inputul are semantică de combobox, rezultatele au stare activă, iar `ArrowUp`, `ArrowDown` și `Enter` pot parcurge și deschide destinațiile. Toate rezultatele rămân și linkuri native.

## Operațional

Nu este necesară o migrare nouă în această fază: extensiile și indexurile necesare există din `0000`–`0002`. Limitatorul reutilizează tabela persistentă introdusă pentru fluxurile publice de recomandare; namespace-ul `scope` separă contoarele.

Conform cerinței proprietarului, nu au fost create și nu au fost rulate teste automate sau QA de browser. Validarea acestei faze este limitată la typecheck, lint și build; testarea funcțională va fi făcută la deployment.
