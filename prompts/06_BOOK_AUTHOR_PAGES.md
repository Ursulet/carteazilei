# PROMPT 06 — Book Intelligence & Author Pages

Use PROMPT 00.

## Objective

Create the highest-value SEO template: `/carte/[slug]`.

## Book page sections

1. breadcrumbs
2. hero:
   - cover
   - title
   - author
   - edition metadata
   - verdict
3. `Merită să o citești dacă…`
4. `Poate să nu fie pentru tine dacă…`
5. `Despre ce este — fără spoilere`
6. themes
7. reading profile visualization
8. editorial strengths
9. caveats / divisive points
10. recommended audience
11. similar books
12. next reads
13. author block
14. retailer offers
15. affiliation disclosure
16. source/edition information
17. feedback entry.

No section may fabricate content when data is absent. Hide gracefully or show `Analiza este în curs` only when route remains intentionally public; preferably do not publish incomplete books.

## Reading profile

Use accessible meter/progress-like visualization.
Do not create flashy charts.

Traits:
- pace;
- complexity;
- emotional intensity;
- world building;
- romance;
- philosophical depth.

Always include text labels.

## Similar books

Each card has:
- target book;
- relation type;
- one-sentence `de ce seamănă`.

No reason => relation should not render publicly.

## Retail

CTA:
`Vezi unde o găsești`.

Show price only if freshness rules pass.

Disclosure near offers.

## Author page

`/autor/[slug]`

Include:
- bio;
- books;
- `De unde să începi`;
- editorial lists;
- sources.

## SEO

Book:
- dynamic metadata;
- canonical;
- Book JSON-LD;
- BreadcrumbList;
- safe serialization.

Author:
- Person/ProfilePage-compatible schema only if correct;
- canonical;
- breadcrumbs.

## Tests

- unpublished book 404s publicly;
- structured data valid JSON;
- absent offer doesn't break;
- relation without public reason excluded.

STOP.
