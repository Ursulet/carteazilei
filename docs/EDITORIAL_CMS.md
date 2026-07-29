# CMS editorial

## Domeniu implementat

Faza 04 oferă fluxuri administrative reale pentru:

- cărți, ediția activă, copertă, taxonomii, scoruri de lectură și suprascrieri SEO;
- autori, cu separarea biografiei publice de faptele verificate și notele de sursă;
- Cartea Zilei, în calendar și listă, cu o singură selecție pentru fiecare dată;
- biblioteca media, cu fișiere în S3-compatible și metadate relaționale în PostgreSQL;
- previzualizarea internă a unei cărți, protejată prin autentificare și `noindex`.

Logica de business este în `src/domain/editorial`, iar interogările compuse pentru admin sunt în `src/db/queries/admin-editorial.ts`. Server Actions validează accesul și deleagă serviciilor de domeniu.

## Flux de publicare

O carte poate trece în starea `published` numai dacă are:

- titlu și slug;
- autor;
- ediție activă;
- copertă cu text alternativ;
- verdict și rezumat fără spoilere;
- cel puțin o rezervă editorială;
- cel puțin un gen;
- încredere editorială de minimum 60%;
- editor atribuit.

Aceeași funcție pură produce atât verdictul server-side, cât și checklistul afișat editorului. Interfața nu oferă câmp JSON-LD liber; datele structurate vor fi generate de aplicație în faza SEO tehnic.

Profilul intern de editor se creează automat, privat, la prima mutație editorială a unui utilizator autorizat. Astfel, fiecare review și selecție zilnică are atribuire explicită înaintea ecranului complet de administrare a editorilor.

## Cartea Zilei

`feature_date` reprezintă data editorială în `Europe/Bucharest`, nu un timestamp aleatoriu. Constrângerea unică din PostgreSQL garantează regula „o dată = o selecție”, iar serviciul transformă încălcarea ei într-un mesaj editorial clar. Nu există mod random.

## Media și S3

Uploadul acceptă JPEG, PNG, WebP și AVIF, cu maximum 5 MB și 40 de megapixeli. Sunt verificate mărimea, MIME-ul declarat, formatul real citit din bytes, dimensiunile, textul alternativ și metadatele editoriale.

Fișierul este scris prin adaptorul S3, apoi metadatele sunt salvate în PostgreSQL. Dacă persistarea metadatelor eșuează, adaptorul încearcă să elimine obiectul încărcat. Ștergerea unei imagini folosite de o ediție este blocată.

Variabile necesare: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` și `S3_FORCE_PATH_STYLE`. `S3_PUBLIC_BASE_URL` este rezervat pentru livrarea publică/CDN din fazele următoare.

## Audit și ștergere

Crearea și modificarea sunt auditate, iar tranzițiile de stare sunt diferențiate ca publish/unpublish. Ștergerea din CMS este logică pentru înregistrările editoriale; elementele sunt arhivate și marcate `deleted_at`, nu eliminate fizic. Fișierele media neutilizate sunt eliminate și din S3.

## Limită asumată

Nu au fost create sau rulate teste pentru publishing gate, data duplicată, permisiuni ori upload. Acestea rămân omise la solicitarea proprietarului și vor fi executate în etapa de deployment.
