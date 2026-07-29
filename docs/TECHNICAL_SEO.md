# SEO tehnic și metadata

## Contractul public

Fiecare rută publică indexabilă expune titlu, descriere, canonical absolut, directive robots, Open Graph și Twitter prin `buildPublicMetadata`. Descrierile sociale sunt normalizate la maximum 160 de caractere, iar imaginea implicită este `public/og.png` (1200×630).

Paginile dinamice păstrează decizia editorială de indexare:

- cartea și autorul folosesc setarea SEO și criteriile proprii de eligibilitate;
- listele, hub-urile și relațiile dintre cărți devin indexabile numai după quality gate;
- pagina curentă Cartea Zilei are canonical către selecția datată; URL-ul curent nu este inclus separat în sitemap;
- filtrele arhivei, căutarea și rezultatele personalizate sunt `noindex`;
- adminul, preview-ul, API-urile și redirecturile comerciale au și `X-Robots-Tag` defensiv.

Un conținut dinamic inexistent apelează `notFound()`. Pagina 404 comună este în `src/app/not-found.tsx`; nu se simulează lipsa conținutului cu răspuns `200`.

## Metadata routes și social cards

- `src/app/robots.ts` permite conținutul public și blochează crawl-ul pentru `/admin`, `/api` și `/go`.
- `src/app/sitemap.ts` publică numai URL-uri canonice și eligibile. Selecțiile zilnice sunt hidratate prin aceeași regulă de completitudine folosită de pagina publică, pentru a evita URL-uri care ajung în 404.
- `public/og.png` este fallbackul general de brand.
- cărțile și listele editoriale au `opengraph-image.tsx` dinamic, construit din date publice reale. Textul este limitat înainte de randare pentru a evita overflow-ul.

## Date structurate

Serializarea din `src/lib/seo/json-ld.tsx` neutralizează caracterele care pot închide sau modifica un tag script. Valorile provin exclusiv din câmpuri text și date publice; HTML brut din admin nu este injectat.

Schema reutilizabilă din `src/lib/seo/schema.ts` acoperă:

- `Organization` și `WebSite`, inclusiv acțiunea de căutare;
- `Book` cu autor, ediție, copertă, ISBN și editură numai când datele există;
- `ProfilePage` și `Person` pentru autori și editori;
- `BreadcrumbList` aliniat cu breadcrumb-ul vizual;
- `ItemList` pentru liste, hub-uri și pagini de relații editoriale.

Nu sunt emise `Review` sau `AggregateRating`: produsul nu afișează un rating public real care să le justifice.

## Redirecturi legacy

`src/lib/seo/legacy-redirects.ts` este sursa unică, data-driven, consumată de `next.config.ts`. Lista rămâne intenționat goală până când faza de import produce URL-uri legacy reale și fiecare sugestie este verificată. Nu activăm redirecturi 301/308 pe baza unor sluguri presupuse.

Pentru o intrare aprobată se adaugă un obiect Next.js cu `source`, `destination` și `permanent: true`. Înainte de activare trebuie confirmate:

1. existența URL-ului vechi în export sau în indexul istoric;
2. echivalența semantică a destinației;
3. absența buclelor și a lanțurilor de redirect;
4. faptul că destinația răspunde public și are canonical propriu.

## Checklist manual pentru lansare

Aceste acțiuni se fac după deployment, pe domeniul final:

- [ ] setează și verifică proprietatea de domeniu în Google Search Console;
- [ ] confirmă accesul public la `/robots.txt`, `/sitemap.xml` și `/og.png`;
- [ ] trimite `https://carteazilei.ro/sitemap.xml` în Search Console și verifică erorile de procesare;
- [ ] inspectează minimum: homepage, o carte, un autor, o listă, un hub, o selecție zilnică, căutarea și un URL 404;
- [ ] verifică pentru mostre statusul HTTP, canonicalul selectat, robots și ultima versiune indexată;
- [ ] rulează Rich Results Test pe o carte, un profil și o listă și confirmă că datele afișate sunt identice cu pagina;
- [ ] verifică preview-urile Open Graph/Twitter pentru fallback, carte și listă;
- [ ] urmărește Core Web Vitals după apariția datelor de teren, cu atenție la LCP pentru coperți și imaginile sociale dinamice;
- [ ] verifică rapoartele Pages/Indexing după prima recrawl și investighează separat `Crawled - currently not indexed`, canonical alternativ și soft 404;
- [ ] activează redirecturile legacy numai după aprobarea raportului de import.

## Verificări în această fază

Au fost folosite doar verificări statice de implementare (`typecheck`, `lint` și build). Scriptul/testul automat de audit SEO cerut în promptul fazei nu a fost creat, conform instrucțiunii proprietarului proiectului de a omite testarea până la deployment. Verificările manuale de mai sus sunt pregătite pentru acel moment.
