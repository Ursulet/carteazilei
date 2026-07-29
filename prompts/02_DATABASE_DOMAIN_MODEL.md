# PROMPT 02 — PostgreSQL + Drizzle Domain Model

Use PROMPT 00.

## Objective

Implement the relational foundation with PostgreSQL 18.4 and Drizzle.

## Database extensions

Create migration enabling:
- `pg_trgm`;
- `unaccent`.

Do not require pgvector in V1.

## Implement tables

Create normalized tables for:
- users;
- roles/user_roles;
- editors;
- authors;
- books;
- book_editions;
- genres;
- themes;
- moods;
- audiences;
- book_genres;
- book_themes;
- book_moods;
- book_audiences;
- book_trait_scores;
- editorial_reviews;
- daily_features;
- book_relationships;
- editorial_lists;
- editorial_list_books;
- retailers;
- book_offers;
- media_assets;
- recommendation_sessions;
- recommendation_results;
- recommendation_feedback;
- seo_metadata;
- audit_logs.

Use UUID primary keys unless there is a clear technical reason otherwise.

## Constraints

Examples:
- unique `books.slug`;
- unique `authors.slug`;
- unique `daily_features.feature_date`;
- check trait values 0..100;
- valid workflow status enums;
- FK with deliberate delete behavior;
- unique relationships where applicable.

Use database enums sparingly where migrations remain manageable; otherwise check-constrained text values.

## Book work vs edition

`books` represents the intellectual work.
`book_editions` represents ISBN/page/publisher/cover-specific data.

Do not put retailer offers directly on `books`.

## Search vectors

Add generated/materialized search strategy for:
- title;
- original title;
- author;
- optional subtitle.

Implement helper query module with:
1. prefix/title matching;
2. trigram fallback;
3. author boosting.

## Seed

Seed only:
- taxonomies;
- admin development account mechanics only if safely gated to development;
- 3 clearly marked fictional/dev books if tests require fixtures.

Never seed fake public testimonials.

## Migrations

Generate SQL migration.
Do not `drizzle-kit push` in production workflow.

## Tests

- unique daily feature;
- trait constraints;
- relation integrity;
- search returns expected fixture;
- published queries exclude draft/inactive content.

STOP after report.
