# 04 — Data Model & Admin Blueprint

## 1. Filosofie

Baza de date trebuie să separe:
- opera editorială;
- work vs edition;
- taxonomii;
- recomandare;
- analytics;
- monetizare.

Nu stoca totul în `books` ca JSON arbitrar.

---

## 2. Entități principale

### books
Opera conceptuală.

Câmpuri orientative:
- id UUID;
- title;
- slug;
- original_title;
- primary_author_id;
- short_verdict;
- spoiler_free_summary;
- editorial_pros;
- editorial_cons;
- status;
- editorial_confidence;
- publication workflow fields;
- created_at;
- updated_at.

### book_editions
- book_id;
- ISBN10/13;
- publisher;
- publication_year;
- language;
- page_count;
- cover_asset_id;
- edition_label;
- active.

### authors
- id;
- name;
- slug;
- bio;
- verified_facts;
- source_notes;
- SEO fields;
- status.

### editors
- id;
- user_id;
- display_name;
- slug;
- bio;
- expertise;
- avatar;
- public_profile.

---

## 3. Taxonomii

Entități:
- genres;
- themes;
- moods;
- audiences;
- reading_traits.

Join tables explicite:
- book_genres;
- book_themes;
- book_moods;
- book_audiences.

Traits numerice:
`book_trait_scores`
- pace 0–100;
- complexity;
- emotional_intensity;
- world_building;
- romance;
- violence;
- philosophical_depth;
- practical_density;
- ambiguity;
- humor.

Fiecare scor poate avea:
- confidence;
- editor note.

---

## 4. Editorial

### editorial_reviews
- book_id;
- editor_id;
- verdict;
- why_read;
- why_not;
- strengths;
- caveats;
- status;
- published_at;
- reviewed_at.

### daily_features
- feature_date DATE unique;
- book_id;
- editor_id;
- headline;
- why_today;
- audience_note;
- caveat;
- status;
- scheduled_at;
- published_at.

Regulă DB:
`UNIQUE(feature_date)` pentru un singur „Cartea Zilei”.

---

## 5. Similarity

### book_relationships
- source_book_id;
- target_book_id;
- type;
- strength;
- public_reason;
- provenance;
- approved_by;
- approved_at;
- active.

Unique:
source + target + type.

---

## 6. Lists / hubs

### editorial_lists
- title;
- slug;
- intro;
- methodology;
- editor_id;
- type;
- indexable;
- status;
- seo fields.

### editorial_list_books
- list_id;
- book_id;
- rank optional;
- reason;
- position.

---

## 7. Reviews publice — Phase 2

### user_reviews
- user_id;
- book_id;
- rating;
- body;
- moderation_status;
- verified_reader flag only if there is a defensible verification rule;
- created_at.

Nu importa recenzii vechi dacă identitatea/sursa nu este verificabilă.

---

## 8. Recommendation

### recommendation_sessions
- id;
- anonymous_session_id;
- user_id nullable;
- branch;
- answers_json validated;
- created_at;
- expires_at.

### recommendation_results
- session_id;
- book_id;
- rank;
- score;
- reason_codes JSONB;
- explanation_snapshot;
- algorithm_version.

### recommendation_feedback
- result_id;
- action;
- rating;
- feedback_tags;
- free_text optional;
- created_at.

Algoritmul trebuie versionat.

---

## 9. Retail / affiliation

### retailers
- name;
- slug;
- base_url;
- affiliate disclosure;
- active.

### book_offers
- edition_id;
- retailer_id;
- purchase_url;
- affiliate;
- price optional;
- currency;
- availability optional;
- checked_at;
- source.

Nu afișa „preț actual” dacă `checked_at` este prea vechi sau sursa nu garantează actualizarea.

---

## 10. Media

### media_assets
- id;
- storage_key;
- mime_type;
- width;
- height;
- alt_text;
- attribution;
- source;
- created_at.

Alt text nu este doar numele fișierului.

---

## 11. SEO fields

Nu toate entitățile au nevoie de 10 coloane duplicate.

Poți folosi:
### seo_metadata
- entity_type;
- entity_id;
- title_override;
- description_override;
- canonical_override only for rare cases;
- og_asset_id;
- indexable;
- last_reviewed_at.

Structured data este generat din date, nu stocat ca JSON arbitrar editabil.

---

## 12. Admin IA

`/admin`
- Dashboard
- Cărți
- Ediții
- Autori
- Cartea Zilei
- Liste editoriale
- Taxonomii
- Relații între cărți
- Recomandări / tuning
- Review feedback
- Media
- SEO
- Retaileri
- Utilizatori / editori
- Setări
- Audit log

---

## 13. Workflow editorial

Book states:
`draft → needs_review → ready → published → archived`

Daily feature:
`draft → scheduled → published → archived`

List:
`draft → review → published`

Nicio publicare critică fără:
- editor;
- minimum fields;
- cover;
- canonical slug;
- verdict;
- at least one caveat;
- taxonomy;
- SEO preview.

---

## 14. Audit log

### audit_logs
- actor_user_id;
- action;
- entity_type;
- entity_id;
- diff / metadata;
- IP hash if legally justified;
- created_at.

Nu loga parole, tokens, secrets sau conținut sensibil inutil.

---

## 15. Roluri

Minimum:
- `admin`;
- `editor`;
- `analyst`.

Admin:
tot.

Editor:
content + publishing, fără user/infra/secrets.

Analyst:
read-only analytics și recommendation feedback.

Cititorii publici nu au nevoie de cont în V1.

---

## 16. Admin safeguards

- destructive actions cu confirmare;
- soft delete pentru content;
- slug uniqueness;
- preview înainte de publish;
- validation server-side;
- media MIME validation;
- link allowlist/scheme validation;
- role check server-side, nu doar UI;
- audit trail.
