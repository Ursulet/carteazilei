# Import legacy și carantina conținutului

## Scop și garanții

Pipeline-ul mută numai date utile în stări interne, fără să transforme exportul vechi într-o sursă automată de adevăr editorial.

- autorii și cărțile noi intră cu `needs_review`;
- metadata SEO rămâne `noindex`;
- ofertele comerciale legacy sunt create numai pentru hosturi mapate și rămân inactive;
- recenziile nu sunt scrise niciodată în `editorial_reviews`, ci în `legacy_review_quarantine`;
- selecțiile istorice Cartea Zilei intră ca draft numai când data are o dovadă aprobată explicit;
- setările de afișare, quiz și site sunt raportate, nu aplicate automat;
- redirecturile sunt doar sugestii `pending_review`, nu configurație activă.

Identitatea `(source_system, source_type, legacy_id)` este unică. Rerularea aceleiași surse cu același hash produce `skip`; dacă sursa s-a schimbat după primul import, înregistrarea este respinsă pentru reconciliere manuală. Slugurile, ISBN-urile, datele zilnice și hashurile media sunt verificate separat pentru duplicate.

## Pregătire

1. Aplică migrația `0009_dapper_aqueduct.sql` prin workflow-ul normal `pnpm db:migrate`.
2. Copiază `config/legacy-import.example.json` într-un fișier local de configurare.
3. Pune fișierele media într-un director local dedicat. `mediaRoot` este rezolvat relativ la fișierul de configurare.
4. Configurează mapările fără a crea taxonomii sau parteneri fictivi.

Configurația controlează:

- `sourceSystem`: namespace stabil pentru export;
- `batchSize`: 1–500 de înregistrări per tranzacție;
- `mediaRoot`: rădăcina permisă pentru fișierele media;
- `defaultEditorId`: editorul responsabil pentru eventuale selecții istorice importate;
- `legacyOrigins`: originile din care pot proveni sugestii de redirect;
- `taxonomyMappings`: etichetă legacy → slug existent pentru genuri, teme și stări;
- `retailerHosts`: hostname exact → slugul unui partener existent;
- `verifiedDailyFeatures`: dată → URL-ul dovezii istorice verificate.

Mapările folosesc numai entități existente. O etichetă necunoscută, un host nemapat sau un partener inexistent ajunge în rejects/warnings și nu este creat automat.

## Formatul exportului

Fișierul JSON poate folosi denumiri românești sau englezești pentru colecțiile `authors/autori`, `books/carti`, `reviews/recenzii/comments/testimonials`, `media/images/covers/attachments` și `dailyFeatures/daily_features/cartea_zilei/featured_history`.

Normalizerul acceptă aliasuri uzuale pentru ID, titlu, autor, slug, pagini, ISBN, copertă, taxonomii, URL comercial și proveniență. Fiecare înregistrare trebuie însă să aibă un ID legacy stabil. Intrările invalide sunt izolate în rejects; nu opresc validarea restului exportului.

Media folosește exclusiv `filePath` relativ la `mediaRoot`. Pipeline-ul nu descarcă URL-uri remote, ceea ce elimină cereri SSRF și păstrează migrarea reproductibilă. URL-ul original poate fi păstrat separat ca proveniență.

## Dry-run implicit

```powershell
pnpm legacy:import -- --input C:\migration\export.json --config C:\migration\mapping.json
```

Dry-runul:

- citește și validează exportul;
- citește baza pentru duplicate și mapări existente;
- validează fișierele media, formatul real, dimensiunile și limita de 5 MB;
- simulează toate deciziile;
- nu scrie în PostgreSQL și nu trimite fișiere în storage.

## Aplicare

După revizuirea raportului:

```powershell
pnpm legacy:import -- --input C:\migration\export.json --config C:\migration\mapping.json --apply
```

Autorii, cărțile, recenziile și selecțiile sunt procesate în batch-uri tranzacționale. Media este excepția controlată: obiectul este încărcat prin adaptorul de storage înaintea tranzacției de metadata, iar la eșecul tranzacției se încearcă ștergerea obiectului. Cheia de stocare este deterministă după SHA-256 pentru deduplicare.

## Rapoarte

Directorul implicit `reports/legacy-import/` primește pentru fiecare rulare:

- `*-report.json`: mod, digestul inputului, contoare, log structurat și duplicate;
- `*-rejects.jsonl`: câte un motiv procesabil pe linie;
- `*-review-quarantine.csv`: reviewer, sursă, carte legată, verificarea originii și motivul carantinei;
- `*-redirect-suggestions.json`: sursă, destinație și status `pending_review`.

Aceste fișiere sunt ignorate de Git deoarece pot include date personale sau operaționale. Nu trebuie copiate în `public/`.

Fără un export legacy real nu este posibilă generarea onestă a unui dry-run report sau rejects report final. Scriptul și formatele de raport sunt livrate; rapoartele efective se generează când proprietarul furnizează exportul.

## Activarea redirecturilor

Sugestiile nu modifică `src/lib/seo/legacy-redirects.ts`. Fiecare intrare trebuie verificată pentru existența URL-ului vechi, echivalența destinației, lipsa buclelor și răspunsul public al destinației. Numai intrările aprobate se copiază ulterior în configurația activă.

## Migrare și verificări

Migrația `0009_dapper_aqueduct.sql` adaugă:

- `legacy_import_records`, registrul idempotent source-to-target;
- `legacy_review_quarantine`, datasetul separat care nu are nicio cale automată de publicare.

Nu au fost create sau rulate teste ori un import demonstrativ, conform deciziei proprietarului proiectului. Au fost folosite numai verificările statice și buildul; dry-runul real rămâne pentru momentul în care există exportul și baza migrată.
