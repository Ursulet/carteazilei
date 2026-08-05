# Motorul de recomandare `recommendation-v2`

Versiunea 2 pastreaza regulile editoriale si comerciale ale motorului initial,
dar sincronizeaza taxonomiile cu administrarea curenta a catalogului.

## Taxonomii active

- Motorul accepta genuri, teme, atmosfere si audiente care nu sunt arhivate.
- Statutul `draft` ramane disponibil pentru lucru editorial si potrivire interna;
  `archived` elimina taxonomia din recomandarile noi.
- Chestionarul afiseaza toate genurile active din admin, independent de cate
  carti sunt deja complet eligibile pentru recomandare.
- Orice gen activ adaugat ulterior functioneaza automat prin potrivirea ID-ului
  ales in chestionar; nu necesita modificarea unei liste hardcodate.

## Potrivirea nevoii de lectura

Pe langa trait-urile editoriale, nevoia principala foloseste semnale controlate
din genuri, teme si atmosfere. Lista semantica este definita in
`src/domain/recommendation/taxonomy-signals.ts` si include toate genurile curente.

Temele cunoscute primesc o potrivire explicita. O tema activa noua, care nu este
inca in harta semantica, poate contribui moderat numai la profunzimea tematica
pentru nevoile de reflectie si iesire din rutina. Nu i se inventeaza un sens.

Audientele continua sa fie evaluate din intervalele de varsta configurate in
admin. Pentru ramura copil, incompatibilitatea de varsta ramane filtru ferm.

## Reguli pastrate

- cartea, autorul si analiza trebuie sa fie publicate;
- increderea editoriala minima ramane `60`;
- ofertele, preturile, afilierea si clickurile nu participa la selectie;
- deal-breakerele ferme elimina candidatul, iar conflictele moderate penalizeaza;
- rezultatele deja salvate nu sunt recalculate;
- rezultatele noi pastreaza versiunea `recommendation-v2` in snapshot.

Verificarea acestei schimbari a fost limitata la typecheck si lint. Testarea de
comportament si QA raman pentru deployment, conform deciziei proiectului.
