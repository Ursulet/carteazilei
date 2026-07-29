# PROMPT 15 — Coolify Production Deployment

Use PROMPT 00.

## Objective

Prepare a reproducible production deployment.

## Dockerfile

Create multi-stage Dockerfile:
- Node 24 LTS image;
- pnpm via corepack;
- frozen lockfile;
- build;
- Next.js standalone output;
- non-root runtime user;
- port 3000;
- production env;
- minimal final image.

Do not bake secrets into image.

## Next config

`output: "standalone"`.

## Health

`GET /api/health`
- app status;
- optional DB lightweight check;
- no secrets.

## Coolify topology

Recommended:
1. Application: Next.js from Git using Dockerfile.
2. PostgreSQL 18.4 separate Coolify resource.
3. Object storage external S3-compatible or separate service.
4. No public Postgres port mapping.

Domain:
`carteazilei.ro` and `www` policy with one canonical host.

SSL via Coolify proxy.

## Env

Required:
- DATABASE_URL
- AUTH_SECRET
- NEXT_PUBLIC_SITE_URL
- storage configuration
- OAuth credentials if used
- analytics config

Mark critical env required in deployment documentation.

## Migrations

Do not run concurrent migrations from every app replica.

Choose one:
- CI release migration step;
- one-off migration job before app rollout.

Document rollback implications.

## Backup

Configure:
- daily DB backup;
- remote destination;
- retention;
- restore procedure.

## Deployment runbook

Create:
`docs/DEPLOYMENT.md`

Include:
- first deploy;
- migration;
- rollback;
- backup restore;
- secret rotation;
- cache invalidation;
- emergency maintenance.

## Post-deploy

- verify health;
- smoke tests;
- Search Console;
- sitemap;
- robots;
- HTTPS;
- canonical host;
- analytics;
- restore test scheduled.

STOP.
