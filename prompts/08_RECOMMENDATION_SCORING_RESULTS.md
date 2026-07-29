# PROMPT 08 — Deterministic Scoring, Explanation & Feedback

Use PROMPT 00.

## Objective

Implement the explainable recommendation engine.

## Candidate filter

Exclude:
- unpublished/inactive;
- low editorial confidence below threshold;
- incompatible age/audience;
- hard deal-breakers.

## Score

Implement versioned engine:
`recommendation-v1`.

Weights:
- need: 26
- genre: 16
- pace: 12
- length: 8
- reference similarity: 18
- audience: 8
- editorial confidence: 8
- diversity/freshness adjustment: 4

Document every function.

Hard conflicts eliminate.
Soft conflicts apply explicit penalty.

## Reference similarity

V1 uses approved `book_relationships`.

Do not call an LLM.

If reference book lacks relation graph, redistribute or normalize available weights rather than creating fabricated similarity.

## Reason codes

Return machine reason codes and a deterministic human explanation builder.

Store:
- algorithm version;
- scores;
- selected reasons;
- explanation snapshot.

## Result page

`/recomanda-mi/rezultat/[opaque-token]`
- noindex;
- ownership/session checks if needed;
- no personally identifying token.

Hero:
`ALEGEREA NOASTRĂ PENTRU TINE`

Do not display a numeric `94%` unless calibrated.
Use labels derived from score bands:
- `Potrivire excelentă`
- `Potrivire foarte bună`
- `Potrivire bună`

Explain:
- 3 reasons;
- 1 caveat.

CTA:
`Vezi analiza completă`

Secondary:
`Nu mă convinge — arată-mi alternativa #2`

## Alternatives

Precompute top 3 with diversity constraint.
Reveal #2/#3 progressively.

No massive grid.

## Feedback

Buttons:
- `Da, pare potrivită`
- `Nu prea`

Later:
- started;
- finished;
- 1–5 recommendation quality.

Store separately.

## Unit tests

Create at least 20 scenario fixtures.
Assert:
- hard exclusions;
- top candidate;
- reason codes;
- diversity;
- missing optional reference;
- low-confidence behavior.

STOP.
