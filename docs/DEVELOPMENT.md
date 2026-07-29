# Dezvoltare locală

## Cerințe

- Node.js 24 LTS
- pnpm 11.6
- PostgreSQL 18 pentru faza bazei de date

## Pornire

1. Copiază `.env.example` în `.env.local` și înlocuiește valorile demonstrative.
2. Instalează dependențele cu `pnpm install --frozen-lockfile` după ce lockfile-ul există.
3. Pornește aplicația cu `pnpm dev`.

Pentru baza de date locală, pornește serviciul din `docker-compose.dev.yml`, aplică migrațiile cu `pnpm db:migrate`, apoi încarcă taxonomiile controlate cu `pnpm db:seed`.

## Limite ale fundației

Faza 01 pregătește shell-ul public, tipografia, token-urile, configurarea mediului și boundary-urile arhitecturale. Schema PostgreSQL, autentificarea, CMS-ul și funcțiile publice sunt implementate numai în fazele lor dedicate.

Fundația livrează implicit directiva globală `noindex,follow`, astfel încât o instanță de lucru să nu publice accidental pagini-placeholder. Directiva va fi înlocuită cu reguli per rută după ce paginile trec pragurile editoriale și tehnice din faza SEO.

## Origini externe și CSP

Politica inițială permite imagini HTTPS, dar conexiunile browserului rămân `self`. Când este ales providerul S3, originea exactă trebuie adăugată deliberat în politica CSP și în configurația `next/image`; cheile S3 rămân exclusiv pe server.

Testele automate și faza QA sunt amânate explicit până la deployment, conform deciziei proprietarului proiectului.

## Stocare media locală

CMS-ul media nu folosește discul local al aplicației. Pentru upload în dezvoltare configurează toate variabilele `S3_*` din `.env.example` către un serviciu S3-compatible. Activează `S3_FORCE_PATH_STYLE=true` numai dacă furnizorul local cere URL-uri de tip path-style.
