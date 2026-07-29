# Analytics, încredere și transparență comercială

## Contractul de evenimente

Jurnalul `product_events` acceptă numai următoarele nume tipate:

- `page_viewed`;
- `recommendation_quiz_started`;
- `recommendation_quiz_completed`;
- `recommendation_result_shown`;
- `recommendation_alternative_requested`;
- `book_viewed`;
- `daily_feature_viewed`;
- `retailer_click`;
- `recommendation_feedback_positive` / `recommendation_feedback_negative`;
- `book_started` / `book_finished`.

Nu există payload JSON liber. Coloanele normalizate păstrează numai referințele relevante, poziția rezultatului, versiunea algoritmului, pagina-sursă și momentul. Un `CHECK` verifică referințele obligatorii pentru fiecare familie de evenimente.

Tabelele specializate rămân sursele operaționale:

- pașii quiz-ului în `recommendation_quiz_events`;
- starea curentă a feedbackului în `recommendation_feedback`;
- afișările și clickurile comerciale în tabelele `commercial_*_events`.

Jurnalul tipat leagă fluxurile pentru analiză, fără să înlocuiască starea de business.

## Colectare și protecții

- Quiz start/completion și feedbackul se scriu server-side în operațiile validate existente.
- Clickul către retailer este salvat înaintea redirectului extern; indisponibilitatea jurnalului agregat nu anulează evenimentul comercial critic.
- Vizualizările și alternativele trec prin `POST /api/analytics/events`, cu Zod, verificarea referințelor publice și rate limiting persistent.
- `page_viewed` păstrează numai calea internă, canalul de achiziție, semnalul de landing și hostname-ul referentului; URL-ul complet și termenul căutat nu sunt trimise.
- Evenimentele repetate de randări React sunt deduplicate. Vizualizările unei cărți sau selecții zilnice sunt deduplicate pe vizitator și zi.
- Cookie-ul first-party `cz_analytics_session` conține un token aleator, `HttpOnly`, `SameSite=Lax`, maximum 30 zile. În bază se salvează numai HMAC-ul tokenului.
- Nu sunt colectate emailuri în jurnal, text liber, user-agent, parametri de query sau amprente de dispozitiv.

## Dashboard intern

`/admin/recommendations` este disponibil rolurilor `admin` și `analyst` și afișează o fereastră mobilă de 30 zile:

- porniri și finalizări ale quiz-ului;
- rata de finalizare de cohortă = sesiuni finalizate / sesiuni pornite în fereastră;
- rata alternativelor = sesiuni care au cerut cel puțin o alternativă / sesiuni cu rezultat principal afișat;
- CTR comercial = clickuri / afișări de ofertă;
- rata feedbackului pozitiv = pozitiv / (pozitiv + negativ);
- distribuția cărților și pozițiilor generate;
- nevoile de lectură declarate agregat;
- semnalele „am început-o” și „am terminat-o”.
- intrările organice și ponderea lor în landingurile first-party;
- paginile cu cele mai multe vizualizări urmărite;
- profilurile care au produs zero rezultate sau un scor principal sub 50;
- starea eșantionului de indexare, afișată ca `—` până când există o sursă Search Console reală.

Când denominatorul lipsește, interfața afișează `—`, nu `0%`. Distribuția rezultatelor nu este prezentată drept clasament public.

## Paginile de încredere

Au fost implementate cu metadata și canonical:

- `/despre`;
- `/cum-recomandam`;
- `/politica-editoriala`;
- `/afiliere`;
- `/echipa`;
- `/editor/[slug]`;
- `/contact`;
- `/legal/confidentialitate` — descriere tehnică, marcată explicit pentru revizuire juridică.

Pagina echipei nu afișează un editor decât dacă profilul este activat explicit și are biografie. Adminul poate edita numele public, slugul, biografia, expertiza și portretul în `/admin/editors/[id]`; schimbările sunt auditate.

## Firewall comercial

Disclosure-ul de lângă ofertele afiliate este:

> Unele linkuri pot fi de afiliere. Dacă cumperi prin ele, Cartea Zilei poate primi un comision, fără cost suplimentar pentru tine. Acest lucru nu influențează recomandarea editorială.

`Promovat` și `Parteneriat comercial` rămân marcaje distincte de afiliere. Modulele comerciale nu sunt importate de motorul de scoring, iar ofertele sunt încărcate numai după stabilirea rezultatului.

## Configurare și limitări asumate

`PUBLIC_CONTACT_EMAIL` este opțional. Dacă proprietarul nu furnizează o adresă reală, pagina de contact spune explicit că acest canal este în curs de configurare; nu se publică o adresă inventată.

Formulările de afiliere, confidențialitate, operator, retenție și drepturi trebuie revizuite juridic și completate cu furnizorii reali înainte de lansare. Nu au fost fabricate testimoniale, ratinguri, premii, sigle de presă sau cifre de audiență.

Conform cerinței proprietarului, nu au fost create și nu au fost rulate teste automate sau QA de browser. Verificarea fazei se limitează la schema generată, typecheck, lint și build.
