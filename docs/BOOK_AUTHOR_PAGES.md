# Pagini publice de carte și autor

## Eligibilitatea unei cărți

Ruta `/carte/[slug]` răspunde public numai pentru o carte și un autor cu stare `published`. În plus, cartea trebuie să aibă:

- o ediție activă;
- copertă activă, text alternativ și dimensiuni cunoscute;
- analiză editorială publicată și editor atribuit;
- verdict;
- rezumat fără spoilere;
- cel puțin o rezervă editorială.

Un slug draft, arhivat, șters sau incomplet răspunde cu 404. Nu există pagină publică umplută cu text demonstrativ.

## Structura paginii de carte

Template-ul poate afișa, numai când datele există:

- copertă, titlu, autor și datele ediției;
- verdict și atribuirea editorului;
- „Merită să o citești dacă” și „Poate să nu fie pentru tine dacă”;
- rezumat fără spoilere;
- teme și audiențe;
- profil de lectură accesibil;
- puncte forte și rezerve editoriale;
- cărți similare și lecturi următoare;
- profilul autorului și listele editoriale relevante;
- oferte active, disclosure afiliat, informații despre ediție și sursa copertei;
- intrare către feedback.

CMS-ul cărții expune acum separat câmpurile `why_read` și `why_not`. Absența lor nu generează copy automat; secțiunea corespunzătoare este ascunsă.

## Profilul de lectură

Vizualizarea folosește bare cu rol semantic `meter`, valoare numerică accesibilă și etichetă textuală. Sunt afișate numai trăsăturile evaluate dintre:

- ritm;
- complexitate;
- intensitate emoțională;
- world-building;
- romance;
- profunzime filozofică.

Scorurile descriu experiența lecturii, nu calitatea cărții.

## Relații editoriale

Blocurile de similaritate și „ce să citești după” folosesc numai relații:

- active;
- orientate de la cartea curentă;
- cu țintă publică și eligibilă;
- cu motiv public nenul;
- ordonate după forța editorială a relației.

Tipul relației și motivul sunt vizibile. Muchiile fără explicație nu apar public.

## Oferte, transparență și prospețimea prețului

Sunt afișate doar ofertele și partenerii activi, în ordinea stabilită în admin. Oferta principală este evidențiată subtil, apoi apar celelalte opțiuni. Fiecare click trece prin redirectul intern de tracking, fără ca datele comerciale să intre în logica editorială. Prețul apare numai dacă:

- există preț și monedă ISO;
- oferta nu este marcată `out_of_stock`;
- `checked_at` este în ultimele 24 de ore și nu este în viitor.

În rest, utilizatorul vede partenerul și starea declarată. Linkurile afiliate folosesc `sponsored nofollow`, iar disclosure-ul este lângă oferte. O plasare plătită are separat eticheta `Promovat` sau `Parteneriat comercial`.

## Pagina autorului

`/autor/[slug]` este disponibilă numai pentru autori publicați care au cel puțin o carte publică eligibilă. Poate include:

- biografie;
- toate cărțile analizate;
- „De unde să începi”, numai din intrări de listă marcate `start_here` sau `de_unde_sa_incepi`;
- liste editoriale publicate;
- fapte verificate și surse.

Nu alegem automat o carte de început după popularitate, scor sau ordine alfabetică.

## SEO și date structurate

Paginile de carte au metadata dinamică, canonical, schema.org `Book` și `BreadcrumbList`. Paginile de autor au `ProfilePage` cu `Person` ca `mainEntity` și breadcrumbs. JSON-LD este construit server-side din coloane validate și serializat cu escaparea caracterelor periculoase; CMS-ul nu furnizează JSON-LD liber.

Indexarea cărții respectă explicit setarea SEO a înregistrării. Pagina autorului folosește setarea SEO când există, iar în lipsa ei cere biografie suficientă și cel puțin o carte eligibilă.

## Limită asumată

Nu au fost create sau rulate testele pentru 404, serializarea datelor structurate, oferta absentă sau excluderea relațiilor fără motiv. Testarea și QA-ul rămân amânate până la deployment.
