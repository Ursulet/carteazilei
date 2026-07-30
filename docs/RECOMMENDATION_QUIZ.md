# Chestionarul de recomandare personalizată

## Domeniul fazei 07

Ruta `/recomanda-mi` oferă trei fluxuri decizionale anonime și funcționale: „Pentru mine”, „Cadou” și „Pentru un copil”. Fiecare ramură are întrebări, validare și adaptare de scoring proprii. Toate folosesc același catalog editorial și același motor determinist, fără ca prețul, ofertele sau parteneriatele comerciale să participe la alegerea cărții.

Capturarea și validarea sesiunii aparțin fazei 07. Faza 08 conectează finalizarea la motorul determinist și redirecționează către snapshotul explicat; dacă nu există un candidat suficient de sigur, interfața afișează o stare onestă în locul unei cărți inventate.

## Pașii „Pentru mine”

1. nevoia principală de lectură;
2. maximum trei genuri sau opțiunea exclusivă „Nu contează genul”;
3. ritmul preferat;
4. lungimea / timpul disponibil;
5. o carte publicată din catalog, opțională, prin autocomplete;
6. unul sau mai multe deal-breakere ori opțiunea exclusivă „Niciunul”.

## Pașii „Cadou”

1. relația cu persoana care primește cartea;
2. categoria aproximativă de vârstă;
3. ocazia;
4. maximum trei interese/genuri sau „Nu știu”;
5. obiceiul de lectură;
6. alegere sigură, echilibrată sau surprinzătoare.

## Pașii „Pentru un copil”

1. categoria de vârstă;
2. nivelul de lectură;
3. citit singur, împreună sau mixt;
4. maximum trei interese/genuri sau „Nu știu”;
5. scopul lecturii;
6. sensibilitățile care trebuie evitate.

Pentru ramura copil, compatibilitatea cu taxonomia de audiență este un filtru obligatoriu. Sunt aplicate suplimentar praguri conservative de violență și atmosferă întunecată pentru grupele mici de vârstă. O carte etichetată numai „Lectură împreună” nu este eligibilă când răspunsul cere citire independentă.

Interfața folosește un reducer tipat și o ordine fixă de stări. Răspunsurile sunt păstrate când utilizatorul navighează înainte și înapoi. Progresul este afișat printr-un singur indicator „Pasul X din 6” și o bară. Alegerile sunt butoane semantice cu `aria-pressed`, marcaj vizual și text, iar autocomplete-ul rămâne utilizabil cu tastatura.

## Persistență și confidențialitate

Nu este necesar cont. La pornire sunt generate:

- un token opac al sesiunii, păstrat numai într-un cookie HTTP-only pentru șapte zile;
- un identificator anonim HTTP-only, folosit pentru continuitate și limitarea abuzului, cu durată de 90 de zile.

În PostgreSQL sunt stocate numai HMAC-urile acestor valori, folosind secretul serverului. Tokenurile brute nu ajung în coloanele bazei de date și tokenul de sesiune nu este expus JavaScript-ului. După finalizare, serverul derivă un capability token separat pentru ruta rezultatului și păstrează numai HMAC-ul lui. Răspunsurile sunt sursa de adevăr în `recommendation_sessions`; nu folosim `localStorage` sau `sessionStorage` pentru datele produsului.

Sesiunile pornite, dar nefinalizate, pot fi considerate abandonate numai inferențial după expirare. Nu este emis un eveniment „abandon” la simpla închidere a paginii.

## Validare și securitate

Fiecare pas are un payload Zod discriminat. Serverul nu acceptă enum-uri arbitrare și verifică suplimentar:

- că genurile selectate sunt publicate și active;
- că alegerea „Nu contează” nu este combinată cu genuri;
- că referința opțională este o carte publicată, cu autor publicat;
- că „Niciunul” nu este combinat cu alte deal-breakere;
- că toate etapele sunt complete înainte de finalizare.

Mutațiile API acceptă numai cereri same-origin. Pornirea, actualizarea, finalizarea și autocomplete-ul folosesc limitare persistentă a cererilor, cu chei HMAC. Răspunsurile API sunt `no-store` și `noindex`.

## Analytics

`recommendation_quiz_events` păstrează evenimente tipate:

- `started` — o singură dată pentru sesiune;
- `step_completed` — cel mult o dată pentru fiecare pas;
- `completed` — o singură dată după validarea profilului complet.

Evenimentele nu conțin text liber, IP sau date comerciale. Migrația `0005_violet_catseye.sql` adaugă evenimentele și tabela de rate limiting.

## SEO și limite

Pagina de intrare `/recomanda-mi` este indexabilă și are canonical propriu. Ruta de rezultat `/recomanda-mi/rezultat/[opaque-token]` este dinamică, `noindex`, `nofollow` și nu publică un canonical tokenizat.

Nu au fost create sau rulate teste unitare, de integrare, E2E, accesibilitate ori QA, conform deciziei proprietarului proiectului. Verificarea acestei faze se limitează la typecheck, lint și build.
