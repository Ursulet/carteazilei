# 09 — Global Acceptance Criteria

## Product

- Homepage explică în prima zonă ce face Cartea Zilei.
- CTA principal este recommendation.
- Cartea Zilei este editorială, nu random.
- Există arhivă datată.
- Quiz-ul întoarce o recomandare principală.
- Rezultatul explică de ce și oferă un caveat.
- Pagina cărții este editorială și utilă fără retailer.
- Afilierea este disclosure-uită.

## SEO

- pagini carte cu canonical;
- generateMetadata server-side;
- sitemap;
- robots;
- breadcrumbs;
- JSON-LD sigur;
- noindex pentru quiz result/search filters/admin;
- 404 real;
- redirect map validat;
- no duplicate title templates evident.

## Trust

- zero review-uri fabricate;
- zero surse inventate;
- editor real;
- metodologie publică;
- sponsored separat.

## Performance

- server render pentru content public;
- book covers optimizate;
- JS client minim;
- fără layout shift de la imagini;
- lazy-loading below-fold.

## Accessibility

- keyboard;
- focus;
- skip link;
- labels;
- contrast;
- reduced motion;
- semantic headings.

## Security

- auth server-side;
- role checks;
- validation;
- rate-limit;
- upload validation;
- secrets numai server;
- CSP/security headers;
- dependency audit.

## Data

- migrations versionate;
- uniqueness constraints;
- FK;
- timestamps;
- audit log pentru opera editorială;
- soft-delete unde e potrivit.

## Deployment

- Dockerfile reproducibil;
- health endpoint;
- Postgres neexpus;
- backups;
- restore test documentat;
- environment separation;
- staging înainte de prod.
