# 03 — Recommendation Engine Blueprint

## 1. Principiu

Motorul nu răspunde la:

> „Care este cea mai bună carte?”

Răspunde la:

> **„Care este cea mai potrivită carte pentru acest cititor, în acest moment?”**

V1 este determinist și explicabil.

LLM-ul nu decide ranking-ul.

---

## 2. Flow principal — pentru mine

### Pasul 1 — obiectiv / nevoie

Întrebare:
**Ce ai nevoie de la următoarea carte?**

Single select:
- să mă captiveze;
- să mă relaxeze;
- să mă facă să gândesc;
- să învăț ceva;
- să mă emoționeze;
- să mă scoată din rutină.

Acesta este semnalul cu cea mai mare greutate.

### Pasul 2 — genuri

Maximum 3.

Include:
- `Nu contează genul` ca opțiune exclusivă.

### Pasul 3 — ritm

- lent și atmosferic;
- echilibrat;
- rapid;
- nu contează.

### Pasul 4 — timp / lungime

- sub 200 pagini;
- 200–350;
- 350–500;
- peste 500;
- nu contează.

### Pasul 5 — carte de referință

Input autocomplete:
**Spune-ne o carte care ți-a plăcut.**

Opțional.

Dacă este selectată o carte din catalog, adăugăm semnale de similarity.

### Pasul 6 — deal-breakers

Multi-select:
- prea mult romance;
- violență explicită;
- subiecte foarte grele;
- slow burn;
- explicații tehnice;
- final ambiguu;
- niciunul.

---

## 3. Ramura „Cadou”

Nu reutiliza aceeași logică.

Întrebări:
1. relație;
2. vârstă aproximativă;
3. ocazie;
4. interese;
5. cât de mult citește;
6. buget — doar dacă avem date comerciale bune;
7. „safe choice” vs „surprinde-mă”.

Rezultatul:
`Cea mai sigură alegere` + motivare.

---

## 4. Ramura „Pentru copil”

Primul semnal:
- vârstă;
- nivel de lectură;
- citește singur / împreună;
- interese;
- scop;
- sensibilități.

Nu recomanda doar pe gen.

Pentru copii, orice etichete de conținut trebuie gestionate conservator și editorial.

---

## 5. Candidate generation

Înainte de scoring, eliminăm:
- inactive;
- out-of-scope;
- fără minimum editorial quality;
- incompatibile cu vârsta;
- hard deal-breakers;
- indisponibile dacă produsul cere neapărat cumpărare și nu avem nicio sursă validă — altfel nu este obligatoriu.

---

## 6. Score V1

Scor conceptual 0–100.

Ponderi inițiale:

- need/mood fit: 26
- genre fit: 16
- pace fit: 12
- length fit: 8
- similarity to liked book: 18
- audience fit: 8
- editorial confidence: 8
- freshness/diversity adjustment: 4

Total: 100.

### Penalties

Hard conflict:
eliminare.

Soft conflict:
-5 până la -25 în funcție de severitate.

### Nu includem implicit

Popularitatea nu trebuie să domine scorul.

Popularitatea poate funcționa ca tie-breaker sau confidence signal cu pondere mică.

---

## 7. Editorial confidence

Fiecare carte are un `editorial_confidence_score`.

Acesta nu înseamnă „cât de bună este cartea”.

Înseamnă:
- avem suficiente date;
- analiza a fost verificată;
- tagging-ul este complet;
- știm cui i se potrivește.

O carte insuficient etichetată nu trebuie să câștige recomandarea doar dintr-un match accidental.

---

## 8. Reason codes

Motorul trebuie să producă reason codes, nu doar un număr.

Exemple:
- `MATCH_PRIMARY_NEED_CAPTIVATING`
- `MATCH_FAST_PACE`
- `MATCH_GENRE_SF`
- `MATCH_REFERENCE_WORLD_BUILDING`
- `AVOID_ROMANCE_LOW`
- `DEALBREAKER_TECHNICAL_EXPLANATIONS`

UI transformă reason codes în limbaj uman.

Exemplu:

> `Ai cerut o carte care să te prindă repede, ai ales SF și ai spus că ți-a plăcut Project Hail Mary. Recomandarea aceasta păstrează ritmul rapid și misterul, dar are mai puține explicații tehnice.`

---

## 9. Rezultatul

### Hero result

**Alegerea noastră pentru tine**

- carte;
- autor;
- confidence label: `Potrivire foarte bună`;
- nu afișa un procent pseudo-științific dacă nu este calibrat statistic.

Până avem calibrare, folosește:
- potrivire excelentă;
- potrivire foarte bună;
- potrivire bună.

### Explicație

`De ce ți-o recomandăm` — 3 motive.

`S-ar putea să nu fie pentru tine dacă` — 1 motiv.

CTA:
`Vezi cartea`

Secundar:
`Nu mă convinge — arată-mi alternativa #2`

---

## 10. Alternative

Alternativele trebuie să fie:
- semantic diferite suficient încât să ofere o alegere reală;
- nu trei volume din aceeași serie;
- nu aceeași carte în ediții diferite.

Aplică diversity constraint pe autor/serie/subgen.

---

## 11. Feedback loop

După result:
- `Pare potrivită?` — da / nu;
- `Am început-o`;
- `Am terminat-o`;
- `Cât de bună a fost recomandarea?` 1–5;
- optional: ce a funcționat / ce nu.

Evenimentele nu modifică instant modelul global fără audit.

Folosim date agregate pentru recalibrare periodică.

---

## 12. Taste profile — Phase 2

Când avem conturi de cititor:

Dimensiuni 0–100:
- pace;
- complexity;
- world building;
- romance;
- darkness;
- emotional intensity;
- philosophical depth;
- practical density;
- humor;
- ambiguity tolerance.

Taste profile se actualizează din:
- explicit answers;
- saved books;
- feedback;
- completions;
- dislikes.

Nu infera trăsături sensibile despre utilizator.

---

## 13. Similarity graph — Phase 2

Tabel `book_relationships`:
- source book;
- target book;
- relation type;
- strength;
- reason;
- provenance: editorial / algorithmic;
- approved_by;
- approved_at.

Types:
- similar_theme;
- similar_style;
- similar_pace;
- similar_world;
- next_read;
- contrast_read.

Embeddings pot propune candidați, dar relațiile publice importante trebuie aprobate editorial.

---

## 14. Testarea motorului

Creează fixtures cu 20–50 scenarii umane.

Exemplu:
- vrea SF rapid, urăște slow burn;
- vrea psihologie practică, sub 250 pagini;
- vrea cadou pentru coleg, non-ficțiune accesibilă;
- copil 8 ani, citește singur, aventură.

Pentru fiecare scenariu:
- expected allowed candidates;
- forbidden candidates;
- top recommendation rationale.

Testele trebuie să verifice și explicația, nu doar ID-ul rezultatului.
