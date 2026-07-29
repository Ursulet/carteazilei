# PROMPT 09 — SEO Hubs, Similar Books & „Ce să citesc după”

Use PROMPT 00.

## Objective

Build an SEO system that scales only when editorial content passes quality gates.

## Public routes

- `/carti/gen/[slug]`
- `/carti/tema/[slug]`
- `/carti/stare/[slug]`
- `/carti/pentru/[slug]`
- `/carti/lungime/[slug]`
- `/ce-sa-citesc-dupa/[book-slug]`
- `/carti-asemanatoare-cu/[book-slug]`
- `/liste/[slug]`

## Quality gate

Indexable hub requires configurable minimum:
- >= 5 eligible books;
- editorial intro;
- methodology/selection context;
- editor;
- public status;
- unique SEO metadata.

If gate fails:
- draft or noindex;
- exclude from sitemap.

## Hub template

Hero:
- H1;
- editorial intro;
- updated date;
- editor.

Selections:
each book has a reason.

Add:
- related hubs;
- quiz CTA;
- methodology note.

## „Ce să citesc după”

Must segment recommendations by the likely thing the user loved:
- theme;
- pace;
- style;
- world;
- emotional effect.

Do not clone the same ordered list from `similar books`.

## Programmatic metadata

Use `generateMetadata`.
No title stuffing.

## Internal linking

Implement reusable relationship navigation.

Avoid auto-linking every occurrence of a keyword.

## Sitemap

Add indexable hub URLs.
Use real `updated_at` / published timestamps for `lastModified`.

## Test

- low-quality hub noindex;
- no duplicate canonical;
- correct breadcrumbs;
- sitemap excludes drafts.

STOP.
