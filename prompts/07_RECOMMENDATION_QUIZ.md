# PROMPT 07 — Personalized Recommendation Quiz

Use PROMPT 00.

## Objective

Replace the old filter-like quiz with a decision-oriented recommendation flow.

## Entry

`/recomanda-mi`

Opening choice:
- `Pentru mine`
- `Cadou`
- `Pentru un copil`

These branch into separate form definitions.

Implement `Pentru mine` completely first.
Implement the other two only after the architecture is reusable and tested; they may initially be hidden behind feature flags if content tagging is insufficient.

## „Pentru mine” steps

1. need
2. genres max 3
3. pace
4. length/time
5. liked book optional autocomplete
6. deal-breakers

Use a typed state machine or strongly typed reducer, not ad-hoc boolean state.

## UX

Container:
`mx-auto w-full max-w-3xl px-5 sm:px-6`

Question H1/H2:
`font-display text-3xl sm:text-4xl`

Choice:
`w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-4 text-left transition`

Selected:
semantic brand border/background + icon/check.

Progress:
`Pasul X din 6` + single bar.

Navigation:
- back;
- continue;
- keyboard-friendly;
- preserve answers.

Reduced motion:
transitions disabled/reduced.

## Persistence

Anonymous recommendation session in DB with privacy-conscious opaque ID.

Do not require account.

## Validation

Server receives a typed validated payload.
Never trust client enum values.

## Analytics

Events:
- started;
- step completed;
- completed;
- abandoned inferentially only if appropriate.

## SEO

Quiz page can be indexed.
Result pages are `noindex`.

STOP after UI + session capture, before implementing final scoring.
