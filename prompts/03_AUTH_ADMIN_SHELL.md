# PROMPT 03 — Authentication & Admin Shell

Use PROMPT 00.

## Objective

Secure internal editorial operations.

## Auth

Implement Auth.js.

Preferred production login for internal team:
- OAuth provider configurable through env, OR
- credentials with Argon2id and strong operational safeguards.

If credentials:
- password hash only;
- minimum password policy;
- login rate limit;
- generic auth errors;
- session rotation strategy;
- secure cookies in production.

## Roles

Server-side:
- admin;
- editor;
- analyst.

Never trust a role coming from client state.

## Routes

`/admin`
- dashboard
- books
- authors
- daily-features
- lists
- taxonomies
- relationships
- recommendations
- media
- seo
- retailers
- editors
- settings
- audit

Implement shell/navigation and route authorization.

Do NOT implement all CRUD features yet.

## Admin visual style

Functional, calm, light.
Do not mirror public display serif excessively inside forms.

Admin content area:
`mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8`

Sidebar desktop + sheet mobile.

## Audit

Implement a reusable audit service for future mutations.

## Tests

- anonymous admin access rejected;
- editor cannot access role management;
- analyst read-only boundary;
- admin access works.

STOP.
