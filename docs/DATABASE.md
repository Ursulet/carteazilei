# Modelul PostgreSQL

## Principii

- `books` reprezintă opera intelectuală; `book_editions` reprezintă ediția, ISBN-ul, coperta și numărul de pagini.
- Ofertele comerciale sunt legate de ediții, nu de opera editorială.
- Taxonomiile și relațiile dintre cărți sunt entități controlate, nu etichete free-text.
- Stările editoriale sunt coloane text cu `CHECK` în PostgreSQL. Astfel păstrăm tipare TypeScript stricte fără costul operațional al modificării frecvente a enum-urilor native.
- Ștergerea conținutului public este soft-delete; tabelele de legătură și datele strict dependente folosesc cascade numai la ștergerea fizică deliberată.
- `seo_metadata` este o asociere polimorfă. Integritatea `entity_type × entity_id` este verificată în serviciul editorial, deoarece PostgreSQL nu poate avea un singur FK spre mai multe tabele.

## Migrații

Ordinea inițială este:

1. `0000_extensions.sql` — activează `pg_trgm` și `unaccent`.
2. `0001_initial_domain.sql` — creează cele 30 de tabele, cheile, verificările și indexurile.
3. `0002_book_search_sync.sql` — sincronizează documentul de căutare pentru titlu, subtitlu, titlu original și autor.
4. `0003_auth_admin_foundation.sql` — adaugă rate limiting-ul persistent și versiunea revocabilă a sesiunii.
5. `0004_ambitious_grey_gargoyle.sql` — extinde partenerii și ofertele, leagă oferta principală de Cartea Zilei și adaugă evenimentele comerciale de click și afișare.
6. `0005_violet_catseye.sql` — adaugă evenimentele tipate ale chestionarului și limitarea persistentă a cererilor de recomandare.
7. `0006_misty_jackal.sql` — adaugă hashul unic al tokenului opac folosit pentru accesarea snapshotului de recomandare.
8. `0007_yellow_randall_flagg.sql` — extinde taxonomiile, asocierile de hub, listele de lungime și relațiile `next_read` pentru quality gate-ul SEO.
9. `0008_nasty_captain_america.sql` — adaugă jurnalul normalizat și tipat al evenimentelor de produs, cu deduplicare și integritate referențială.
10. `0009_dapper_aqueduct.sql` — adaugă registrul idempotent al importului legacy și carantina separată pentru recenzii neverificate.
11. `0010_chunky_blonde_phantom.sql` — adaugă măsurarea first-party a paginilor de intrare, canalul de achiziție și indecșii pentru dashboardul primelor 30 de zile.

Migrațiile se generează cu Drizzle Kit și se aplică numai cu `db:migrate`; `push` nu face parte din workflow-ul proiectului.

Rolul care aplică prima migrație trebuie să poată crea extensiile `pg_trgm` și `unaccent`. Aplicația de producție va folosi ulterior un rol fără privilegii administrative, separat de rolul de migrare.

## Căutare

`books.search_text` este textul normalizat fără diacritice și are index trigram. `books.search_document` este un `tsvector` ponderat:

- titlu și autor: A;
- subtitlu și titlu original: B.

Triggerul cărții actualizează ambele câmpuri la orice modificare. Schimbarea numelui unui autor recalculează documentele cărților asociate. Query helper-ul de catalog prioritizează titlul exact, prefixul de titlu, autorul exact/prefix și similaritatea trigram a titlului. Full-text search și taxonomiile editoriale adaugă semnale cu pondere mai mică.

Căutarea publică rulează într-o tranzacție read-only logică cu `statement_timeout` local de 900 ms. Cărțile și autorii sunt filtrate prin criteriile reale de eligibilitate publică, iar listele păstrează pragurile editoriale și SEO. Inputul este parametrizat prin Drizzle; nu se construiește SQL din textul utilizatorului.

## Seed

`db:seed` este idempotent și adaugă numai:

- rolurile interne `admin`, `editor`, `analyst`;
- genurile, temele, stările/nevoile și audiențele inițiale;
- cele zece trăsături numerice de lectură.

Nu creează utilizatori, cărți, recenzii, testimoniale sau conținut public demonstrativ. Taxonomiile noi rămân `draft` și `noindex` implicit.

## Analytics

`product_events` este un jurnal append-only pentru evenimentele de produs care traversează mai multe module. Numele evenimentului este limitat prin `CHECK`, iar referințele obligatorii depind de familie: cale și canal pentru vizualizarea paginii, sesiune/rezultat pentru recomandări, carte pentru vizualizare, selecție zilnică pentru Cartea Zilei și ofertă pentru clickul extern.

Evenimentele care descriu aceeași expunere au `dedupe_key` unic. Cheile străine folosesc `restrict`, deoarece eliminarea fizică a entității ar distruge contextul unei măsurători; fluxurile editoriale normale folosesc deja soft-delete. Jurnalul nu păstrează payload JSON liber sau identificatori personali direcți.

## Dezvoltare locală

`docker-compose.dev.yml` pornește PostgreSQL 18.4 numai pe interfața locală `127.0.0.1`. Configurația Coolify de producție va folosi credențiale separate și nu va publica portul bazei de date.
