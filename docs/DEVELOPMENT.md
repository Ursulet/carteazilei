# Dezvoltare locală

## Cerințe

- Node.js 24 LTS
- pnpm 11.6
- PostgreSQL 18

## Pornire

1. Copiază `.env.example` în `.env.local` și înlocuiește valorile demonstrative.
2. Instalează dependențele cu `pnpm install --frozen-lockfile`.
3. Pornește PostgreSQL din `docker-compose.dev.yml`.
4. Aplică migrațiile cu `pnpm db:migrate` și încarcă taxonomiile controlate cu
   `pnpm db:seed`.
5. Pornește aplicația cu `pnpm dev`.

Containerul PostgreSQL pentru dezvoltare publică portul numai pe `127.0.0.1`.
Credențialele sale demonstrative nu trebuie reutilizate în producție.

## Crawl control și metadate

Rutele publice eligibile au metadata, canonicale și reguli de indexare per pagină.
Rutele admin, API, căutare, redirect comercial și rezultatele private de
recomandare primesc `noindex` la nivel HTTP. Configurația completă este documentată
în `docs/TECHNICAL_SEO.md`.

## Origini externe și CSP

Browserul poate încărca imagini HTTPS, însă conexiunile client rămân `self`.
Fișierele S3 sunt servite public prin ruta same-origin `/media/[id]`; cheile S3
rămân exclusiv pe server. Orice integrare browser nouă trebuie adăugată deliberat
în CSP.

## Stocare media locală

CMS-ul media nu folosește discul local al aplicației. Pentru upload în dezvoltare
configurează toate variabilele `S3_*` din `.env.example` către un serviciu
S3-compatible. Activează `S3_FORCE_PATH_STYLE=true` numai dacă furnizorul cere
URL-uri de tip path-style.

## Validare

Typecheck, lint și build sunt verificări statice permise în timpul implementării.
Testele automate, E2E, accesibilitatea și QA-ul în browser sunt amânate explicit
până la deployment, conform deciziei proprietarului proiectului. Porțile rămase
sunt enumerate în `PRODUCTION_READINESS.md`.
