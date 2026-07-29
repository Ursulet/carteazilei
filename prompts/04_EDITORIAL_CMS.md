# PROMPT 04 — Editorial CMS: Books, Authors, Daily Feature

Use PROMPT 00.

## Objective

Build the core admin workflows before public page complexity.

## Books admin

List:
- title;
- author;
- status;
- editorial confidence;
- updated;
- missing-fields indicator.

Create/edit:
- title;
- original title;
- slug;
- author;
- spoiler-free summary;
- short verdict;
- strengths;
- caveats;
- status;
- edition;
- cover;
- taxonomy;
- trait scores;
- SEO overrides only where needed.

Do not expose raw arbitrary JSON-LD field.

## Publishing gate

A book cannot be `published` without:
- title;
- slug;
- author;
- at least one active edition;
- cover with alt text;
- verdict;
- summary;
- at least 1 caveat;
- genre;
- editorial confidence above configured threshold;
- editor attribution.

Render friendly validation checklist.

## Authors

CRUD:
- name;
- slug;
- bio;
- fact/source notes;
- public status.

## Daily Feature

Calendar/list UI.

Create scheduled feature:
- date;
- book;
- editor;
- headline;
- why_today;
- audience_note;
- caveat.

One date = one feature.

No random mode.

Timezone:
`Europe/Bucharest`.

## Preview

Add preview route protected from indexing and unauthorized access.

## Media

S3-compatible upload adapter.
Validate:
- size;
- MIME;
- supported image type.

Store metadata.

## Audit

Log publish, unpublish, delete, edit.

## Tests

- publishing gate;
- daily duplicate date;
- role permissions;
- upload validation.

STOP.
