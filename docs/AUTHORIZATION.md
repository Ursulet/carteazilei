# Autentificare și autorizare internă

## Model

Zona `/admin` folosește Auth.js cu provider Credentials și sesiuni JWT semnate. Utilizatorii și rolurile rămân în PostgreSQL; parola este stocată numai ca hash Argon2id.

JWT-ul conține ID-ul utilizatorului și versiunea sesiunii, nu rolurile ca sursă de adevăr. Fiecare boundary admin recitește utilizatorul activ și rolurile din baza de date. Dezactivarea contului, eliminarea tuturor rolurilor sau incrementarea `session_version` invalidează accesul chiar dacă acel cookie nu a expirat încă.

Auth.js resemnează JWT-ul când sesiunea este citită, dar aplicația păstrează momentul autentificării inițiale și impune server-side o durată absolută de maximum 8 ore. Cookie-urile devin `Secure` în producție. `revokeUserSessions` poate incrementa versiunea contului pentru invalidarea tuturor sesiunilor existente.

## Parole

Bootstrap-ul cere minimum 14 caractere, literă mare, literă mică și cifră. Parametrii Argon2id sunt:

- memorie: 64 MiB;
- iterații: 3;
- paralelism: 1.

Autentificarea folosește un hash Argon2id demonstrativ când utilizatorul nu există, pentru a reduce diferențele de timp dintre cont existent și cont inexistent. Mesajul public rămâne generic.

## Rate limiting

Încercările sunt urmărite în `auth_rate_limits` prin chei HMAC-SHA256. Emailul și IP-ul nu sunt stocate în clar.

- maximum 5 încercări pentru combinația IP + email în 15 minute;
- maximum 25 de încercări pentru un IP în 15 minute;
- blocare 15 minute după depășirea pragului;
- contoarele relevante sunt șterse după autentificare reușită.

Coolify trebuie configurat să suprascrie și să transmită corect `X-Forwarded-For` sau `X-Real-IP`; aplicația nu trebuie expusă direct în paralel cu proxy-ul de încredere.

## Roluri

- `admin`: acces complet, inclusiv utilizatori, retaileri, setări și audit;
- `editor`: conținut, taxonomii, media și SEO;
- `analyst`: dashboard și recomandări, exclusiv read-only.

Meniul ascunde modulele nepermise, dar decizia reală este repetată server-side în pagină și trebuie repetată în fiecare server action viitoare prin `requireMutationAccess`.

## Primul administrator

1. Aplică migrațiile și rulează `pnpm db:seed`.
2. Configurează temporar `ALLOW_ADMIN_BOOTSTRAP=true`, `ADMIN_EMAIL`, `ADMIN_NAME` și `ADMIN_PASSWORD`.
3. Rulează `pnpm auth:create-admin` o singură dată.
4. Șterge parola din mediul shell/Coolify și setează imediat `ALLOW_ADMIN_BOOTSTRAP=false`.

Scriptul refuză suprascrierea unui utilizator existent și scrie operația în audit log. Nu există parole sau conturi implicite în repository.
