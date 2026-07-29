# PROMPT 05 — Public Homepage + Cartea Zilei + Archive

Use PROMPT 00.

## Objective

Implement the public brand experience.

## Homepage

Build sections in this exact hierarchy:

1. Header
2. Hero
3. Cartea Zilei
4. Quiz conversion block
5. Need/mood discovery
6. Genre / audience discovery
7. `Ce să citești după`
8. Editorial lists
9. Methodology/trust
10. newsletter placeholder only if operational
11. Footer

### Hero copy baseline

Eyebrow:
`RECOMANDĂRI DE CARTE, NU LISTE INTERMINABILE`

H1:
`Ce carte merită timpul tău?`

Body:
`Spune-ne ce cauți, ce stare ai și ce ți-a plăcut până acum. Cartea Zilei îți recomandă o singură alegere principală și îți explică de ce.`

Primary:
`Recomandă-mi o carte`

Secondary:
`Vezi Cartea Zilei`

Search label:
`Caută o carte, un autor sau o temă`

Do not use invented stats such as `15.000+ books` unless DB supports the claim.

## Cartea Zilei section

Must render today's editorial feature in `Europe/Bucharest`.

Fields:
- date;
- cover;
- title;
- author;
- verdict;
- 3 fit points;
- caveat;
- editor.

CTA:
`Vezi analiza`

Secondary:
`Vezi unde o găsești`

No `Cumpără acum`.

Fallback if no daily feature:
do not select random.
Render a controlled editorial fallback or hide section with an admin alert; log missing schedule.

## `/cartea-zilei`

Current feature landing page.

## `/cartea-zilei/[date]`

Persistent dated page.

## `/cartea-zilei/arhiva`

Grid/list grouped by month/year.
Filters server-driven without creating crawlable combinatorial URLs.

## Tailwind requirements

Hero:
`grid items-center gap-10 lg:grid-cols-12 lg:gap-16`

Hero text:
`lg:col-span-7`

Supporting visual:
`lg:col-span-5`

H1:
`font-display text-5xl tracking-[-0.03em] sm:text-6xl lg:text-7xl`

Sections:
`py-16 md:py-24 lg:py-28`

Cards:
`rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]`

## SEO

- homepage metadata;
- current daily canonical strategy;
- dated canonical;
- archive metadata;
- breadcrumbs on dated/archive pages.

## Tests

- date selection Bucharest timezone;
- no random fallback;
- archive ordering;
- mobile navigation;
- no fake content.

STOP.
