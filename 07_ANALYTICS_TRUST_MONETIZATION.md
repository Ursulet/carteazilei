# 07 — Analytics, Trust & Monetization

## 1. Event taxonomy

### Acquisition
- page_view
- organic_landing
- internal_search

### Quiz
- recommendation_quiz_started
- recommendation_step_completed
- recommendation_quiz_completed
- recommendation_result_shown
- recommendation_alternative_requested

### Engagement
- book_viewed
- book_saved
- daily_feature_viewed
- archive_browsed
- similar_book_opened
- next_read_opened

### Commercial
- retailer_offer_viewed
- retailer_click

### Feedback
- recommendation_feedback_positive
- recommendation_feedback_negative
- book_started
- book_finished
- recommendation_rating_submitted

---

## 2. Event payload discipline

Include:
- event;
- anonymous session ID;
- content IDs;
- algorithm version;
- coarse acquisition info.

Nu include:
- parole;
- email în event payload dacă nu este necesar;
- text liber sensibil;
- fingerprinting agresiv.

---

## 3. Product dashboard

Admin dashboard minimum:
- quiz starts;
- completion;
- top needs;
- top recommendations;
- alternative request rate;
- retailer CTR;
- recommendation success feedback;
- zero-result / low-confidence sessions;
- organic landing pages.

---

## 4. Editorial dashboard

- daily features scheduled;
- missing feature dates;
- published books with incomplete taxonomy;
- pages lacking editor;
- stale pages needing review;
- broken retailer links;
- low editorial confidence.

---

## 5. Trust rules

### Absolute
- fără testimoniale inventate;
- fără review attribution fals;
- fără rating simulat;
- fără „verificat” dacă nu există verificare;
- fără sponsorizare ascunsă;
- fără preț „actual” din date vechi.

### Public disclosures
- metodologie;
- afiliere;
- politică editorială;
- update date;
- autor/editor;
- corrections policy.

---

## 6. Monetizare

### Phase 1
Afiliere retailer.

### Phase 2
Newsletter sponsorship marcat clar.

### Phase 3
Publisher partnership:
- pagini de lansare sponsorizate;
- branded editorial separat;
- nu ranking personalizat.

### Phase 4
B2B insights agregate:
numai date anonimizate/agregate și numai dacă cadrul legal/consimțământul permit.

---

## 7. Firewall editorial

Tabel intern:
`sponsored_campaigns` separat de recommendations.

Motorul de recomandare nu primește `sponsor_bid` ca feature.

Dacă un titlu sponsorizat este afișat:
- label `Promovat`;
- container distinct;
- nu este numit `Alegerea noastră pentru tine` dacă plasarea este plătită.

---

## 8. Brand trust metric

Urmărește periodic:
- „Ai avea încredere într-o recomandare Cartea Zilei?”
- „Recomandarea a fost relevantă?”
- „Ai reveni pentru următoarea carte?”

Brandul este produsul pe termen lung.
