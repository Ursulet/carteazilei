# Homepage public și Cartea Zilei

## Rolul produsului

CarteaZilei.ro este o platformă editorială românească de book discovery. Nu încearcă să câștige prin numărul de titluri, ci prin reducerea alegerii: o recomandare principală, argumente concrete și o limită spusă sincer.

Produsul final combină trei motoare:

1. **Cartea Zilei** — o selecție editorială unică, datată și arhivată;
2. **Recomandă-mi o carte** — o alegere deterministă și explicabilă după contextul cititorului;
3. **Book Intelligence** — pagini editoriale despre cărți, autori, liste și relații de lectură, utile atât deciziei, cât și căutării organice.

Afilierea monetizează eventual decizia, dar nu participă la selecție sau scoring.

## Homepage

Pagina principală urmează ierarhia din blueprint:

- mesajul principal și accesul la quiz, Cartea Zilei și căutare;
- selecția editorială a zilei;
- conversia către quiz;
- descoperire după stare, gen și audiență;
- trasee „Ce să citești după”;
- liste editoriale;
- metodologia și principiile de încredere.

Secțiunile editoriale bazate pe baze de date apar numai dacă există înregistrări publicate și eligibile. Nu sunt introduse cărți, statistici, liste sau recomandări demonstrative. Newsletterul nu este afișat deoarece nu există încă un flux operațional și GDPR-compliant.

## Selecția zilei

Data curentă este calculată explicit în `Europe/Bucharest`. Selecția publică trebuie să aibă:

- stare `published`;
- carte și autor publicați;
- titlu editorial, motivul zilei și nota de audiență;
- minimum trei puncte de potrivire;
- o rezervă editorială;
- verdict și copertă validă, cu text alternativ și dimensiuni.

Dacă această înregistrare lipsește, homepage-ul și `/cartea-zilei` afișează un fallback editorial controlat și trimit către arhivă. Nu se alege niciodată o carte aleatorie, iar lipsa programării este înregistrată în logul serverului.

## URL-uri și canonical

- `/cartea-zilei` este intrarea către selecția curentă;
- canonical-ul ei indică `/cartea-zilei/YYYY-MM-DD` când există o selecție validă;
- `/cartea-zilei/[date]` păstrează pagina editorială persistentă;
- `/cartea-zilei/arhiva` grupează selecțiile după lună și an.

Pagini datate inexistente sau incomplete răspund cu 404 real. O pagină curentă fără selecție este `noindex`. Filtrele arhivei sunt server-side; variantele filtrate au canonical către arhiva de bază și sunt `noindex`, evitând spațiile combinatorii crawlable.

## Coperte și retaileri

Coperțile private din S3 sunt livrate prin ruta cache-uită `/media/[id]`, fără expunerea cheii de stocare sau a credentialelor. Dimensiunile cunoscute sunt folosite pentru a evita salturile de layout.

Pagina datată poate afișa ofertele active ale ediției. Nu sunt afișate prețuri nevalidate, CTA-ul nu folosește formularea „Cumpără acum”, iar linkurile afiliate sunt marcate `sponsored nofollow` și însoțite de disclosure.

## Limită asumată

Nu au fost create sau rulate testele solicitate în prompt pentru data Bucureștiului, fallback, ordine, navigare mobilă sau conținut fals. Faza de testare și QA rămâne rezervată deploymentului, conform deciziei proprietarului proiectului.
