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

Migrațiile se generează cu Drizzle Kit și se aplică numai cu `db:migrate`; `push` nu face parte din workflow-ul proiectului.

Rolul care aplică prima migrație trebuie să poată crea extensiile `pg_trgm` și `unaccent`. Aplicația de producție va folosi ulterior un rol fără privilegii administrative, separat de rolul de migrare.

## Căutare

`books.search_text` este textul normalizat fără diacritice și are index trigram. `books.search_document` este un `tsvector` ponderat:

- titlu și autor: A;
- subtitlu și titlu original: B.

Triggerul cărții actualizează ambele câmpuri la orice modificare. Schimbarea numelui unui autor recalculează documentele cărților asociate. Query helper-ul prioritizează titlul exact, prefixul de titlu, autorul exact/prefix, apoi similaritatea trigram și full-text rank.

## Seed

`db:seed` este idempotent și adaugă numai:

- rolurile interne `admin`, `editor`, `analyst`;
- genurile, temele, stările/nevoile și audiențele inițiale;
- cele zece trăsături numerice de lectură.

Nu creează utilizatori, cărți, recenzii, testimoniale sau conținut public demonstrativ. Taxonomiile noi rămân `draft` și `noindex` implicit.

## Dezvoltare locală

`docker-compose.dev.yml` pornește PostgreSQL 18.4 numai pe interfața locală `127.0.0.1`. Configurația Coolify de producție va folosi credențiale separate și nu va publica portul bazei de date.
