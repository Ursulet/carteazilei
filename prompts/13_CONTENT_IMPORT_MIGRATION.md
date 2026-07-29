# PROMPT 13 — Legacy Import & Data Quarantine

Use PROMPT 00.

## Objective

Migrate useful legacy data without importing legacy trust problems.

## Input

Legacy export will contain variants of:
- books;
- authors;
- reviews;
- display settings;
- quiz tags;
- site settings;
- media.

## Build import pipeline

Requirements:
- dry-run;
- idempotent;
- structured log;
- duplicate detection;
- validation;
- rejects file;
- transaction batches.

## Mapping

Books:
legacy title/author/slug -> work.
Page count/cover -> edition.
genres/themes/moods -> controlled taxonomy mapping.

Purchase URL -> retailer offer only after URL host mapping.

## Reviews quarantine

Every legacy review enters a quarantine dataset unless its origin is verified.

Do not publish legacy testimonials by default.

Create report:
- reviewer;
- source;
- linked book;
- reason for quarantine.

## Daily features

Do not fabricate daily archive from random display history.

Only import dates with verifiable historical record.

## Media

Re-upload through storage abstraction.
Preserve provenance metadata.

## Redirect map

Generate suggestions from legacy slug/URLs.
Require review before activating 301.

## Deliverables

- import script;
- mapping config;
- dry-run report;
- rejects report;
- migration notes.

STOP.
