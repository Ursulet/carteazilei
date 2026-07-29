# PROMPT 12 — Technical SEO Hardening

Use PROMPT 00.

## Objective

Make every public template crawlable, canonical and semantically correct.

## Implement

### Metadata
- dynamic titles/descriptions;
- canonical;
- OG;
- Twitter;
- robots directives.

### Metadata routes
- `robots.ts`;
- `sitemap.ts` or segmented sitemaps;
- dynamic `opengraph-image.tsx` for book/list pages where valuable.

### JSON-LD
Reusable safe components/functions for:
- Organization/WebSite;
- Book;
- BreadcrumbList;
- Person/ProfilePage where applicable.

Review/AggregateRating only if visible real data supports it.

Sanitize JSON-LD serialization and never inject raw admin HTML.

### Breadcrumbs
Visual + structured.

### Crawl control
Noindex:
- admin;
- auth;
- preview;
- search;
- recommendation results;
- insufficient hubs.

### 404
Real `notFound()` behavior.
No soft 404.

### Redirects
Create data/config-driven mapping for legacy URL migration.

## QA script

Create an internal SEO audit script/test to inspect a URL fixture set for:
- title;
- description;
- canonical;
- H1 count;
- robots;
- JSON-LD presence;
- status.

## Manual launch checklist

Document:
- Search Console verification;
- sitemap submission;
- sample URL inspection;
- Rich Results Test;
- Core Web Vitals watch.

STOP.
