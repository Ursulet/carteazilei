# 05 — Design System & UX Blueprint

## 1. Direcție

**Modern Literary Editorial × Product Intelligence**

Nu:
- e-commerce agresiv;
- glassmorphism abundent;
- negru + aur peste tot;
- luxury hotel aesthetic;
- Goodreads clone.

Trebuie să arate ca:
- o publicație culturală foarte bine editată;
- cu ergonomia unui produs software modern.

---

## 2. Paletă

### Light-first
Site-ul principal trebuie să fie light-first pentru lizibilitate editorială.

```text
Paper        #F6F1E7
Warm White   #FCFAF5
Ink          #171512
Muted Ink    #716B61
Border       #DDD4C5
Gold         #B78A3E
Gold Dark    #8D672C
Forest       #173A32
Forest Soft  #DDE7E1
Danger       #9B3A32
```

### Dark accent zones
Dark poate apărea:
- footer;
- editorial feature band;
- modal/quiz focus mode, dacă testele UX confirmă;
- nu ca fundal implicit al tuturor paginilor.

---

## 3. Tipografie

Recomandare:
- Display / titluri: `Newsreader` sau `Source Serif 4`;
- UI / body: `Inter`.

Motiv:
serif editorial modern + sans foarte lizibil.

Folosește `next/font` pentru self-hosting automat al fonturilor unde licența permite.

### Scale orientativă

Desktop:
- Hero H1: `text-5xl lg:text-7xl tracking-[-0.03em]`
- Section H2: `text-3xl lg:text-5xl`
- Card title: `text-xl lg:text-2xl`
- body: `text-base lg:text-lg`
- metadata: `text-sm`

Mobile:
nu forța titluri enorme care împing CTA-ul sub fold.

---

## 4. Layout

Global container:
`mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8`

Reading container:
`mx-auto max-w-3xl`

Section spacing:
`py-16 md:py-24 lg:py-28`

Dense utility sections:
`py-10 md:py-14`

Grid:
- hero: `grid lg:grid-cols-12 gap-10 lg:gap-16`
- content/text: 5–7 columns;
- cover/art: 4–5 columns.

---

## 5. Buttons

Primary:
`inline-flex min-h-11 items-center justify-center rounded-full bg-[#173A32] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#102B25] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173A32] focus-visible:ring-offset-2`

Secondary:
`inline-flex min-h-11 items-center justify-center rounded-full border border-[#CFC3B2] bg-transparent px-6 py-3 text-sm font-medium text-[#171512] transition hover:bg-[#EFE8DC]`

Gold nu este culoarea principală de CTA în toate locurile.
Gold este accent editorial.

---

## 6. Cards

Default:
`rounded-2xl border border-[#DDD4C5] bg-[#FCFAF5]`

Fără glow.

Hover pentru card clickabil:
`transition duration-200 hover:-translate-y-0.5 hover:border-[#B7A78F] hover:shadow-sm`

Respectă `prefers-reduced-motion`.

---

## 7. Book cover

Coperta trebuie să rămână obiect vizual important.

- aspect ratio real;
- `object-contain`;
- fundal neutru;
- shadow subtil;
- fără rotații 3D gratuite pe listări;
- hover 3D doar dacă este extrem de discret și nu afectează performanța.

---

## 8. Header

Sticky doar dacă nu ocupă mult.

Class direction:
`sticky top-0 z-50 border-b border-black/5 bg-[#FCFAF5]/90 backdrop-blur`

Logo:
wordmark lizibil, nu doar emblemă mică.

---

## 9. Homepage micro-interactions

- CTA: 150–200ms;
- card hover: 180–220ms;
- quiz step transition: opacity + translate 8–12px;
- progress bar: spring moderat;
- cover hover: max scale 1.015;
- no infinite decorative motion.

---

## 10. Quiz UX

Desktop:
`max-w-3xl`.

Question card:
nu o închide într-un card gros dacă nu este necesar.

Choice:
`rounded-2xl border px-5 py-4 text-left`

Selected:
- border Forest;
- soft forest background;
- check icon;
- nu te baza doar pe culoare.

Navigation:
Back left, Continue right.
Mobile: buttons full width / sticky bottom action doar dacă nu acoperă conținut.

Progress:
text `Pasul 2 din 6` + bar.
Nu afișa două metrici redundante `2/6` și `33%` dacă nu adaugă valoare.

---

## 11. Recommendation result

Trebuie să fie un moment de reveal.

Eyebrow:
`ALEGEREA NOASTRĂ PENTRU TINE`

H1:
titlul.

Confidence label:
`Potrivire foarte bună`

Block:
`De ce ți-o recomandăm`

Caveat:
`De știut înainte`

Actions:
- `Vezi analiza completă`
- `Arată-mi alternativa #2`

Nu afișa o grilă de 12 rezultate sub acest moment.

---

## 12. Page hierarchy pentru carte

Desktop:
- breadcrumbs;
- hero 12-col;
- sticky mini TOC doar pe pagini foarte lungi;
- section separators fine;
- CTA retailer nu domină editorialul.

Mobile:
- cover;
- metadata;
- verdict;
- action;
- restul secțiunilor.

---

## 13. Accessibility

Minimum:
- WCAG 2.2 AA ca obiectiv;
- focus vizibil;
- contrast verificat;
- semantic buttons/links;
- labels reale;
- `aria-live` la rezultatul quiz-ului;
- keyboard navigation;
- skip link;
- reduced motion;
- alt text contextual;
- icon-only buttons cu accessible name.

---

## 14. Copy UI

CTA recomandat:
- `Recomandă-mi o carte`
- `Găsește-mi cartea`
- `Vezi analiza`
- `Vezi unde o găsești`
- `Salvează`
- `Arată-mi alternativa #2`

Evită:
- `CUMPĂRĂ ACUM` când nu există checkout propriu;
- `Află mai multe` repetat;
- `Explorează` pe fiecare buton.

---

## 15. Design tokens

În Tailwind v4, definește tokens CSS-first.

Developer Agent trebuie să folosească token-uri semantice:
- `--color-paper`;
- `--color-ink`;
- `--color-muted`;
- `--color-brand`;
- `--color-accent`;
- `--color-border`;
- etc.

Nu hardcoda hex-uri prin zeci de componente după bootstrap-ul inițial.
