# Deployment CarteaZilei.ro în Coolify

Acest runbook descrie deploymentul reproductibil al aplicației, nu execută
deploymentul. Checklistul de validare funcțională rămâne în
[`PRODUCTION_READINESS.md`](../PRODUCTION_READINESS.md).

Referințe operaționale Coolify:

- [Dockerfile Build Pack](https://next.coolify.io/docs/applications/build-packs/dockerfile)
- [variabile build-time și runtime](https://coolify.io/docs/knowledge-base/environment-variables)
- [health checks](https://coolify.io/docs/knowledge-base/health-checks)
- [backupuri PostgreSQL](https://coolify.io/docs/databases/backups)

## 1. Topologia de producție

Folosește trei resurse independente în aceeași destinație/rețea privată Coolify:

1. aplicația Next.js construită din Git cu `Dockerfile`, targetul final `runner`;
2. PostgreSQL **18.4**, resursă separată, fără port public sau mapare host;
3. storage S3-compatible extern ori serviciu separat, cu bucket privat.

Aplicația expune numai portul intern `3000`. Traefik/Coolify termină TLS și trimite
traficul către acel port; nu configura o mapare de tip `3000:3000` pe host.

Hostul canonic ales este `https://carteazilei.ro`. Configurează certificatul pentru
apex și `www`, apoi redirect permanent de la `https://www.carteazilei.ro` către
apex. HTTP trebuie redirecționat la HTTPS. HSTS include subdomeniile, deci toate
subdomeniile publice trebuie să rămână disponibile prin HTTPS.

## 2. Imaginea Docker

`Dockerfile` conține:

- Node.js 24 Alpine și pnpm 11.6 prin Corepack;
- instalare cu lockfile înghețat;
- build Next.js `standalone`;
- target final minimal, fără surse și fără unelte de migrare;
- utilizator non-root `nextjs`;
- healthcheck pe `http://127.0.0.1:3000/api/health`;
- target separat `migrator` pentru joburi one-off.

Build local echivalent:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=https://carteazilei.ro \
  --target runner \
  --tag carteazilei:<commit> .
```

Singura valoare acceptată ca build argument este `NEXT_PUBLIC_SITE_URL`, fiind
publică și inclusă deliberat în bundle. Schimbarea domeniului cere rebuild.
Credențialele și secretele sunt exclusiv runtime; nu le marca drept Build Variable
în Coolify și nu le transmite prin `--build-arg`.

## 3. Variabile de mediu

### Aplicația publică

| Variabilă | Moment | Secret | Regula de producție |
| --- | --- | --- | --- |
| `DATABASE_URL` | runtime | da | utilizator app fără superuser; host/port intern |
| `AUTH_SECRET` | runtime | da | aleator, minimum 32 caractere, stabil între deployuri |
| `NEXTAUTH_URL` | runtime | nu | exact `https://carteazilei.ro` |
| `NEXT_PUBLIC_SITE_URL` | build + runtime | nu | exact `https://carteazilei.ro`, fără slash final |
| `HEALTHCHECK_DATABASE` | runtime | nu | `true` pentru readiness complet; `false` doar pentru liveness |
| `SEO_HUB_MINIMUM_BOOKS` | runtime | nu | implicit `5`, nu coborî sub pragul editorial |
| `PUBLIC_CONTACT_EMAIL` | runtime | nu | adresă reală, verificată înainte de lansare |
| `S3_ENDPOINT` | runtime | nu | endpoint HTTPS al providerului |
| `S3_REGION` | runtime | nu | regiunea providerului |
| `S3_BUCKET` | runtime | nu | bucket privat dedicat |
| `S3_ACCESS_KEY_ID` | runtime | da | credential limitat la bucket/prefix |
| `S3_SECRET_ACCESS_KEY` | runtime | da | secret runtime, blocat în UI |
| `S3_FORCE_PATH_STYLE` | runtime | nu | `true` numai dacă providerul o cere |
| `S3_PUBLIC_BASE_URL` | runtime | nu | opțional; nu este necesar pentru ruta `/media/[id]` |

Toate cele cinci valori S3 principale trebuie configurate împreună. În producție,
storage-ul este obligatoriu pentru uploadurile CMS, chiar dacă aplicația poate porni
fără el. Nu există chei externe de analytics în V1: evenimentele de produs sunt
stocate în PostgreSQL.

### Numai pentru joburi one-off

- `ALLOW_ADMIN_BOOTSTRAP=true`
- `ADMIN_EMAIL`
- `ADMIN_NAME`
- `ADMIN_PASSWORD`

Aceste valori nu se configurează permanent pe aplicația publică. Se injectează
doar în execuția inițială `auth:create-admin`, apoi se elimină și parola se rotește
dacă a fost transmisă printr-un canal temporar.

## 4. PostgreSQL și rolurile

Resursa PostgreSQL nu primește Public Port. Conectarea se face prin hostname-ul
intern Coolify. Dacă baza este pe alt server sau alt provider, folosește TLS și
restricții de rețea/firewall.

Separă, unde providerul permite:

- rolul de migrare/owner, capabil să creeze extensiile `pg_trgm` și `unaccent`,
  tabele, indecși și constrângeri;
- rolul aplicației, fără superuser și fără drept de a modifica schema, cu drepturi
  DML pe schema aplicației și secvențele ei.

Configurează default privileges pentru obiectele create ulterior de rolul de
migrare. Aplicația folosește URL-ul rolului limitat; targetul `migrator` primește
temporar URL-ul rolului de migrare.

## 5. Migrații: o singură execuție per release

Migrațiile nu rulează la pornirea aplicației și nu se atașează fiecărei replici.
Strategia aleasă este un **job one-off înaintea rolloutului aplicației**.

Pentru fiecare release:

1. blochează deployurile concurente;
2. confirmă un backup finalizat și descărcabil;
3. construiește același commit cu targetul Docker `migrator`;
4. rulează o singură instanță cu `DATABASE_URL` al rolului de migrare;
5. execută comanda implicită `pnpm db:migrate` și păstrează logul;
6. numai după exit code `0`, rulează rolloutul targetului `runner`;
7. pentru primul deploy, rulează separat `pnpm db:seed` din același target;
8. rulează o singură dată `pnpm auth:create-admin` cu variabilele temporare de
   bootstrap, apoi elimină-le.

În Coolify, targetul `migrator` poate fi construit ca resursă operațională separată
cu auto-deploy și healthcheck dezactivate. Se pornește manual, se verifică logul și
se oprește după succes. Nu folosi Post-deployment Command pe fiecare replică.

### Implicații pentru rollback

Migrațiile Drizzle sunt forward-only. Un rollback al imaginii nu anulează schema.
Preferă schimbări compatibile în pași `expand → migrate data → contract`, astfel
încât versiunea anterioară a aplicației să poată rula temporar pe schema nouă.

Dacă o migrare incompatibilă a ajuns în producție:

1. oprește scrierile și activează mentenanța;
2. salvează logurile și un dump de incident;
3. restaurează backupul pre-migrare într-o instanță separată;
4. validează ținta restaurată;
5. mută aplicația la baza restaurată și redeployează imaginea anterioară;
6. nu edita migrarea deja publicată; livrează ulterior o migrare compensatorie.

## 6. Primul deploy

1. Creează proiectul și mediul `production` în Coolify.
2. Creează PostgreSQL 18.4 în rețeaua privată, fără port public.
3. Creează/verifică bucketul media privat și credentialul cu privilegii minime.
4. Configurează backupul DB înainte de primul conținut real.
5. Adaugă resursa aplicației din Git cu build pack `Dockerfile`, port expus `3000`,
   fără port mapping și target final `runner`.
6. Configurează toate variabilele; numai `NEXT_PUBLIC_SITE_URL` este build + runtime.
7. Atașează domeniile apex și `www`, Force HTTPS și redirectul `www → apex`.
8. Construiește imaginea fără a o pune încă în trafic.
9. Rulează targetul `migrator`, apoi seed-ul și bootstrapul administratorului.
10. Deployează o singură replică și așteaptă healthcheck-ul verde.
11. Verifică logurile pentru erori și absența secretelor/datele quizului.
12. Execută porțile post-deploy din `PRODUCTION_READINESS.md`; abia apoi activează
    traficul sau mărește numărul de replici.

## 7. Health și monitorizare

`GET /api/health` întoarce exclusiv stări generice și durata probei, fără URL-uri,
erori SQL sau secrete.

- `HEALTHCHECK_DATABASE=false`: liveness pentru proces și configurație;
- `HEALTHCHECK_DATABASE=true`: include `SELECT 1`, timeout 2 secunde și răspuns 503
  dacă baza nu este disponibilă.

Dockerfile-ul include healthcheck, iar Coolify folosește healthcheckul definit în
Dockerfile înaintea celui din UI. Adaugă și un monitor extern pe
`https://carteazilei.ro/api/health`, plus alerte pentru 5xx, spațiu pe disc,
conexiuni DB și eșecuri de backup.

## 8. Backup și restaurare

Configurația minimă:

- dump PostgreSQL complet zilnic, într-o fereastră cu trafic redus;
- 7 copii locale și minimum 30 de zile în storage S3 off-server;
- criptare, acces separat de credentialele aplicației și alertă la eșec;
- versioning/retention pentru bucketul media, dacă providerul permite;
- test de restaurare lunar într-o bază izolată.

Coolify generează dumpuri PostgreSQL în format custom; restaurarea se face cu
`pg_restore`. Nu restaura direct peste baza activă. Procedura sigură:

1. descarcă și verifică existența/mărimea dumpului ales;
2. creează o bază izolată cu aceeași versiune majoră și extensiile necesare;
3. rulează `pg_restore --verbose --clean --if-exists --no-acl --no-owner` către
   baza izolată, folosind credentiale transmise securizat;
4. verifică migrațiile, numărul entităților critice și autentificarea pe un mediu
   fără trafic public;
5. pentru recovery real, activează mentenanța, oprește scrierile și schimbă
   `DATABASE_URL` numai după aprobarea explicită a țintei restaurate;
6. redeployează și rulează health/smoke checks înainte de redeschiderea traficului.

Înregistrează lunar data, backupul folosit, durata, RPO/RTO observate și persoana
care a aprobat testul. Backupul instanței Coolify nu înlocuiește backupul bazei
CarteaZilei.

## 9. Rollback aplicație

Pentru o regresie fără schimbare incompatibilă de schemă:

1. marchează incidentul și oprește auto-deployul;
2. selectează în Coolify ultima imagine locală sănătoasă sau redeployează commitul
   anterior;
3. păstrează variabilele runtime și baza neschimbate;
4. urmărește healthcheck-ul și logurile;
5. execută smoke-checkurile critice înainte de redeschiderea completă.

Coolify poate reveni doar la imaginile încă disponibile local; păstrează cel puțin
ultimele două release-uri sănătoase ori publică imagini imutabile într-un registry.

## 10. Rotația secretelor

### `AUTH_SECRET`

Rotația invalidează sesiunile admin și tokenurile HMAC pentru recomandări,
analytics și rate limiting. Programează mentenanță, rotește valoarea runtime,
redeployează toate replicile simultan și anunță editorii că trebuie să se
reautentifice.

### Credențiale PostgreSQL

Creează o parolă/rol nou, acordă privilegiile necesare, actualizează secretul
aplicației, redeployează, verifică health, apoi revocă vechiul credential. Nu rupe
conexiunea activă înainte ca noua configurație să fie sănătoasă.

### Credențiale S3

Creează cheia nouă cu aceeași politică minimă, actualizează aplicația, verifică
upload/read/delete pe un obiect controlat, apoi revocă cheia veche. Nu loga cheile
și nu le marca Build Variable.

## 11. Cache invalidation

Mutațiile din admin invalidează rutele relevante prin `revalidatePath`. Pentru o
corecție operațională:

- un redeploy golește cacheul local al containerului;
- dacă este introdus un CDN, purge-uiește numai URL-urile/tagurile afectate;
- media are cache immutable, deci o imagine înlocuită trebuie salvată ca resursă
  nouă/ID nou, nu suprascrisă sub aceeași adresă;
- cacheurile platformelor sociale pentru OG pot necesita propriile instrumente de
  refresh și nu sunt controlate de Next.js.

## 12. Mentenanță de urgență

1. Oprește auto-deployul și blochează o a doua intervenție concurentă.
2. Activează pagina/modul de mentenanță la proxy; nu expune direct containerul.
3. Pentru incidente de date, oprește toate scrierile și joburile operaționale.
4. Păstrează PostgreSQL și storage-ul pornite dacă investigația/backupul le cere.
5. Salvează logurile, commitul, imaginea, migrarea și momentul incidentului.
6. Alege rollback aplicație sau restore DB după natura incidentului.
7. Rulează health și porțile critice înainte de a elimina mentenanța.
8. Documentează cauza, intervalul, impactul și acțiunile preventive.

## 13. Checklist post-deploy

Verificările funcționale, E2E, accesibilitate, performanță și SEO nu sunt executate
în această etapă. La deployment, proprietarul trebuie să confirme cel puțin:

- health 200, DB `ok`, HTTPS și redirect canonic;
- login/roluri, CRUD/preview/publicare și upload media;
- Cartea Zilei, carte/autor/hub/listă, quiz și rezultat personalizat;
- oferte, disclosure, redirect și tracking comercial;
- robots, sitemap, canonical, JSON-LD, OG și 404;
- analytics și rate limiting fără date sensibile în log;
- ultimul backup reușit și un restore test deja programat.

Verdictul de lansare se schimbă numai în `PRODUCTION_READINESS.md`, după atașarea
dovezilor acestor verificări.
