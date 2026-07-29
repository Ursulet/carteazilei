# Hub-uri SEO, similaritate și trasee de lectură

## Principiul de publicare

Rutele SEO nu sunt filtre indexabile generate automat. O pagină poate intra în sitemap numai când are conținut editorial suficient și o intenție distinctă. Pragul este configurat server-side prin `SEO_HUB_MINIMUM_BOOKS`, cu valoarea implicită și minimă `5`.

Quality gate-ul comun cere:

- status publicat și solicitare explicită de indexare;
- minimum cinci cărți publice, cu fișă editorială eligibilă;
- motiv specific pentru fiecare carte afișată;
- introducere editorială;
- metodologie sau context de selecție;
- editor atribuit;
- titlu și descriere SEO prezente și neduplicate față de altă entitate indexabilă.

Un hub publicat care pierde pragul după arhivarea unei cărți devine automat `noindex` și dispare din sitemap, chiar dacă flagul editorial de indexare a rămas activ. Conținutul lipsă nu este completat automat și nu sunt create pagini demonstrative.

## Rute publice

Sunt implementate:

- `/carti/gen/[slug]`;
- `/carti/tema/[slug]`;
- `/carti/stare/[slug]`;
- `/carti/pentru/[slug]`;
- `/carti/lungime/[slug]`;
- `/liste/[slug]`;
- `/carti-asemanatoare-cu/[book-slug]`;
- `/ce-sa-citesc-dupa/[book-slug]`.

Toate folosesc metadata server-side, canonical propriu, breadcrumbs și un singur H1. Template-ul comun afișează editorul, data reală a ultimei revizii, motivele selecțiilor, metodologia, hub-uri apropiate contextual și CTA-ul către quiz.

Hub-urile de lungime sunt liste editoriale de tip `length_hub`, cu interval minim/maxim de pagini. O carte contează pentru quality gate numai dacă ediția activă are număr de pagini în interval și restul fișei publice este eligibil. Tipul are canonical exclusiv sub `/carti/lungime`; ruta `/liste/[slug]` nu îl acceptă.

## Similaritate versus „Ce să citesc după”

Cele două pagini folosesc seturi disjuncte:

- similaritatea folosește numai relațiile `similar_theme`, `similar_pace`, `similar_style` și `similar_world`;
- continuarea folosește numai `next_read` și cere baza editorială `theme`, `pace`, `style`, `world` sau `emotional_effect`.

Astfel, pagina de continuare nu clonează lista ordonată a paginii de similaritate. Relațiile publice trebuie să fie active, aprobate, să indice cărți eligibile și să aibă motiv public. Ofertele comerciale, clickurile și popularitatea nu participă la relații.

## Administrare

Placeholder-ele din admin au fost înlocuite cu fluxuri reale:

- Liste editoriale — conținut, tip, interval de lungime, selecții, ordine, segment, motive și metadata;
- Taxonomii — clasificare, context, introducere, metodologie, selecții explicate și metadata;
- Relații între cărți — sursă, destinație, tip, bază pentru next read, forță, proveniență, motiv și aprobare;
- SEO — rezumatul hub-urilor cu indexare solicitată/noindex și criteriile obligatorii.

Editorul curent este atribuit server-side. Activarea unei relații înregistrează editorul aprobator și data aprobării. Mutațiile sunt validate cu Zod, autorizate server-side și scrise în audit log.

Clasificarea unei cărți poate exista fără motiv de hub. Numai asocierile cu motiv public intră în selecția SEO. Editarea obișnuită a cărții păstrează motivul, poziția și intensitatea definite în hub și nu schimbă accidental genul principal.

## Sitemap și linking intern

`/sitemap.xml` este generat din baza de date. Include numai:

- cărți și autori publicați, eligibili și marcați indexabil;
- articole Cartea Zilei publicate;
- hub-uri, liste și pagini de relații care trec quality gate-ul.

`lastModified` folosește timestampurile editoriale reale. Drafturile, hub-urile sub prag și rezultatele personale nu sunt incluse.

Homepage-ul afișează numai hub-uri și trasee care trec gate-ul la momentul cererii. Navigarea contextuală de pe pagina cărții duce separat către similaritate și continuare, iar hub-urile conexe sunt alese după cărțile comune; nu se face auto-linking mecanic al fiecărei apariții de cuvânt-cheie.

## Migrare și verificări

Migrația `0007_yellow_randall_flagg.sql` adaugă metodologia taxonomiilor, motivele și pozițiile asocierilor, intervalele pentru hub-urile de lungime și baza editorială pentru relațiile `next_read`.

Nu au fost create sau rulate teste unitare, de integrare, E2E, accesibilitate ori QA, conform deciziei proprietarului. Verificarea etapei se limitează la typecheck, lint, diff check și build.
