# PROMPT 14 — QA, Security, Accessibility & Performance Gate

Use PROMPT 00.

## Objective

Do not deploy until the production gate passes.

## E2E flows

Playwright:
1. homepage → daily feature;
2. homepage → quiz → result → book;
3. alternative #2;
4. book → author;
5. book → retailer click;
6. archive;
7. search;
8. admin login;
9. editor publishes daily feature;
10. unauthorized admin access blocked.

## Accessibility

Run automated checks where possible and manually verify:
- tab order;
- focus;
- headings;
- dialogs;
- search panel;
- quiz;
- reduced motion.

## Security review

Check:
- role bypass;
- IDOR;
- CSRF;
- XSS in editorial content;
- JSON-LD injection;
- open redirect via retailer URL;
- unrestricted upload;
- brute-force login;
- leaked env;
- public DB exposure.

## Performance

Measure representative:
- homepage;
- book;
- hub;
- quiz.

Fix:
- oversized cover;
- client bundles;
- unnecessary fonts;
- layout shifts;
- server waterfalls.

## SEO smoke

Check:
- canonical;
- index/noindex;
- sitemap;
- 404;
- JSON-LD;
- breadcrumbs.

## Exit

Produce `PRODUCTION_READINESS.md` with pass/fail.

Do not mark ready if any critical security/trust issue remains.

STOP.
