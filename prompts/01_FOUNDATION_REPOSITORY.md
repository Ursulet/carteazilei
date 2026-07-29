# PROMPT 01 — Foundation, Repository & Design Tokens

Use PROMPT 00 as binding operating instructions.

## Objective

Create the new CarteaZilei 2.0 foundation with no business feature shortcuts.

## Tasks

### 1. Bootstrap

Create Next.js App Router project with:
- `src/`;
- TypeScript;
- ESLint;
- Tailwind;
- pnpm.

Pin framework to stable major/minor compatible with Next 16; do not use canary.

Set:
- Node engine `>=24 <25`;
- packageManager field;
- strict TypeScript;
- `noUncheckedIndexedAccess`.

Scripts:
- dev;
- build;
- start;
- lint;
- typecheck;
- test;
- test:e2e;
- db:generate;
- db:migrate;
- db:studio.

### 2. Structure

Create the folder structure from the technical blueprint:
`components`, `db`, `domain`, `lib`, `styles`, `tests`.

Do not populate features prematurely.

### 3. Tailwind v4

Configure CSS-first tokens in `src/app/globals.css`.

Use semantic design variables for:
- background;
- surface;
- text;
- muted;
- border;
- brand;
- brand-hover;
- accent;
- accent-soft;
- danger.

Set base body:
warm white/paper, ink text.

### 4. Fonts

Use `next/font`.
Choose:
- `Newsreader` for display;
- `Inter` for UI/body.

Expose CSS variables and use them via Tailwind/theme.

### 5. Global shell

Create:
- skip link;
- Header;
- Footer;
- Main layout;
- responsive navigation;
- mobile sheet/drawer using accessible primitive.

Header classes should approximate:
`sticky top-0 z-50 border-b border-black/5 bg-[color:var(--surface)]/90 backdrop-blur`

Container:
`mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8`

No final business nav dead links: stub pages may be created, but clearly functional.

### 6. Security headers

Create `next.config.ts` policy for:
- X-Content-Type-Options;
- Referrer-Policy;
- Permissions-Policy;
- frame protections/CSP approach.

Do not break Next Image or future storage host; document allowed origins.

### 7. Environment

Create typed env parser with Zod:
- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- storage placeholders.

Create `.env.example` without secrets.

### 8. Testing

Add:
- one layout render/smoke test;
- one Playwright homepage smoke test.

## Acceptance

- responsive light editorial shell;
- no black/gold legacy aesthetic;
- no console errors;
- strict typecheck;
- production build succeeds;
- Lighthouse-unfriendly client bundles avoided.

STOP after reporting.
