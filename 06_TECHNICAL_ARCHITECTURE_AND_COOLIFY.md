# 06 — Technical Architecture & Coolify

## 1. Alegerea stack-ului

### Runtime
- Node.js **24 LTS**.
- Nu folosi Node 26 Current pentru producție la start.

### Web
- Next.js **16.x stable**, App Router;
- React 19;
- TypeScript strict;
- Server Components by default;
- Client Components numai unde interactivitatea o cere;
- Turbopack în dezvoltare/build unde suportul dependențelor este stabil.

### Styling/UI
- Tailwind CSS **4.3.x**;
- shadcn/ui ca sursă de componente, nu ca design final;
- Radix primitives unde este necesar;
- Motion doar în fluxurile care au nevoie de animație.

### Database
- PostgreSQL **18.4**;
- extensions:
  - `pg_trgm`;
  - `unaccent`;
  - `citext` doar dacă este justificat;
  - `vector` Phase 2, dacă instalarea este suportată pe instanța aleasă.

### ORM/migrations
- Drizzle ORM;
- Drizzle Kit;
- migrations SQL versionate în repo;
- nu folosi schema push direct în producție.

### Auth
- Auth.js;
- admin/editor auth;
- credential flow doar cu hashing modern și rate-limit, sau OAuth pentru echipa internă;
- conturile publice sunt Phase 2.

### Validation
- Zod la boundary: forms, route handlers, environment.

### Storage
- interfață S3-compatible;
- recomandat producție: Cloudflare R2 sau MinIO separat;
- aplicația nu depinde de provider în business logic.

### Analytics
- product events critice în PostgreSQL;
- Umami/Plausible pentru web analytics, opțional;
- nu bloca V1 de un stack analytics prea greu.

---

## 2. De ce Next.js

Produsul are:
- mii de pagini publice;
- metadata dinamică;
- pagini SEO;
- server rendering;
- cache;
- OG images;
- admin interactiv;
- quiz.

Next.js App Router se potrivește mai bine decât SPA-ul Vite vechi.

---

## 3. Repo structure

```text
carteazilei/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── carte/[slug]/page.tsx
│   │   │   ├── autor/[slug]/page.tsx
│   │   │   ├── cartea-zilei/page.tsx
│   │   │   ├── cartea-zilei/arhiva/page.tsx
│   │   │   ├── cartea-zilei/[date]/page.tsx
│   │   │   ├── recomanda-mi/page.tsx
│   │   │   ├── carti/...
│   │   │   ├── ce-sa-citesc-dupa/[slug]/page.tsx
│   │   │   ├── carti-asemanatoare-cu/[slug]/page.tsx
│   │   │   ├── liste/[slug]/page.tsx
│   │   │   └── despre/...
│   │   ├── admin/
│   │   ├── api/
│   │   ├── robots.ts
│   │   ├── sitemap.ts
│   │   ├── opengraph-image.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── book/
│   │   ├── editorial/
│   │   ├── recommendation/
│   │   └── admin/
│   ├── db/
│   │   ├── schema/
│   │   ├── queries/
│   │   ├── mutations/
│   │   └── index.ts
│   ├── domain/
│   │   ├── books/
│   │   ├── recommendation/
│   │   ├── editorial/
│   │   ├── seo/
│   │   └── retail/
│   ├── lib/
│   │   ├── auth/
│   │   ├── analytics/
│   │   ├── env/
│   │   ├── storage/
│   │   └── security/
│   ├── styles/
│   └── types/
├── drizzle/
├── scripts/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
├── Dockerfile
├── docker-compose.dev.yml
├── next.config.ts
├── drizzle.config.ts
├── package.json
└── pnpm-lock.yaml
```

---

## 4. Rendering strategy

### Public editorial pages
Server Components.

### Static / cached
Book, author, hub, list:
pre-render/cache + explicit invalidation on admin publish.

### Dynamic
- quiz;
- admin;
- search suggestions;
- recommendation session.

### Admin publish
După publish/update:
- invalidează tag-urile relevante;
- nu da full cache purge dacă nu este necesar.

---

## 5. Search

V1:
PostgreSQL:
- tsvector;
- unaccent;
- trigram similarity;
- title/author boosting.

Search results:
- carte;
- autor;
- listă/hub.

Nu introduce Elasticsearch/Meilisearch înainte să existe volum care justifică ops suplimentar.

---

## 6. API / server actions

Folosește server actions pentru mutații simple din admin doar dacă:
- validarea este server-side;
- auth/role check este în aceeași boundary;
- erorile sunt controlate.

Route handlers pentru:
- public API;
- webhooks;
- recommendation endpoints dacă separarea ajută testarea;
- health endpoint.

Business logic nu stă în componenta React.

---

## 7. Security

### Obligatoriu
- TypeScript strict;
- server-side authorization;
- Zod;
- CSRF strategy conform auth framework;
- secure cookies;
- rate limiting pe login/recommendation abuse;
- password hashing Argon2id dacă folosești credentials;
- upload MIME + size validation;
- image processing controlat;
- URL scheme validation;
- output encoding;
- JSON-LD sanitization;
- no secrets in client bundle;
- Content Security Policy compatibilă cu stack-ul;
- security headers;
- dependency audit.

### DB
- user fără superuser pentru app;
- migrations cu rol separat dacă este posibil;
- backup;
- connection limit;
- TLS dacă DB este separată fizic.

---

## 8. Coolify deployment

Recomandare:
- App Next.js ca **Application** din Git, Dockerfile;
- PostgreSQL ca resource separat managed de Coolify;
- storage separat;
- nu expune portul Postgres public;
- app port intern 3000.

Next.js:
- `output: "standalone"`;
- multi-stage Dockerfile;
- health endpoint `/api/health`;
- Coolify domain `https://carteazilei.ro:3000` ca routing intern conform UI, fără public host-port mapping.

### Environment
- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- storage keys
- analytics keys
- optional email keys

Secrets numai în Coolify.

---

## 9. Backups

Minimum:
- daily PostgreSQL backup;
- off-server / S3-compatible;
- retention policy;
- restore test lunar;
- media bucket versioning unde providerul permite.

Un backup netestat nu este strategie de recovery.

---

## 10. CI

Pe PR:
1. install frozen lockfile;
2. lint;
3. typecheck;
4. unit tests;
5. integration tests;
6. build;
7. Playwright smoke pentru rutele critice.

Deploy prod doar din branch protejat.

---

## 11. Observability

- structured server logs;
- request ID unde este util;
- error tracking;
- health check;
- DB health;
- uptime monitor extern.

Nu loga quiz answers cu informații personale inutile.

---

## 12. Performance budgets

Ținte:
- LCP sub ~2.5s pe pagini editoriale în condiții bune;
- CLS < 0.1;
- INP bun;
- imaginile au width/height;
- book covers optimizate;
- JS client minim.

Nu transforma paginile SEO în client-rendered apps.

---

## 13. Biblioteci — regulă

Developer Agent nu adaugă pachete pentru:
- utilități triviale;
- animații care pot fi CSS;
- date manipulation simplu.

Orice dependency nouă trebuie justificată în raportul etapei.
