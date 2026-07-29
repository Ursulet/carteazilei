# PROMPT 10 — Search & Discovery

Use PROMPT 00.

## Objective

Implement fast, forgiving site search without introducing an external search cluster.

## Search index

PostgreSQL:
- unaccent;
- tsvector;
- pg_trgm.

Boost:
1. exact title;
2. prefix title;
3. author exact/prefix;
4. trigram title;
5. thematic content with lower weight.

## UI

Header search opens accessible command/search panel.

Input placeholder:
`Caută o carte, un autor sau o temă`

Results grouped:
- Cărți
- Autori
- Liste / ghiduri

Keyboard:
- arrow navigation;
- enter;
- escape;
- focus return.

## Full page

`/cauta?q=...`

Search result pages:
`noindex,follow`.

Do not include them in sitemap.

## Empty state

Suggest:
- recommendation quiz;
- popular hubs;
- not fake queries.

## Security/performance

- parameterized queries via ORM;
- max query length;
- rate limit;
- debounce;
- minimum character threshold;
- query timeout safeguard.

## Tests

- diacritics;
- non-diacritics;
- typo similarity;
- title vs author boost;
- malicious input does not escape query layer.

STOP.
