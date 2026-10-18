# Angular-Blueprint – Personenverwaltung

Angular 21 + Angular Material. Personen und ihre Adressen erfassen, bearbeiten und löschen,
gegen eines von mehreren REST-Backends, zur Laufzeit umschaltbar (Toolbar → «Backend»).

## Starten

```bash
npm install
npm start          # http://localhost:4200, Dev-Proxy aus proxy.conf.json
npm test           # Jest
npm run build
```

## Backends

Konfiguriert in `public/config.json` (zur Laufzeit geladen, kein Rebuild nötig). Jeder Eintrag hat
einen `kind`, der die REST-Strategie bestimmt:

| id | Projekt | kind | Proxy → Ziel |
|---|---|---|---|
| `java` | Java-Blueprint | `blueprint-api` | `/backend/java` → http://localhost:5105 |
| `net-api` | NET-Blueprint / Api (Controller) | `blueprint-api` | `/backend/net-api` → https://localhost:7102 |
| `net-minimal-api` | NET-Blueprint / Minimal.Api | `blueprint-api` | `/backend/net-minimal-api` → https://localhost:7202 |
| `net-minimal` | NET-Blueprint.Minimal | `blueprint-minimal` | `/backend/net-minimal-standalone` → http://localhost:5237 |

- Keines der Backends erlaubt CORS → im Dev-Betrieb läuft alles über den Proxy. Für ein Deployment
  `baseUrl` auf die echte URL setzen und im Backend CORS freischalten (oder Reverse-Proxy).
- Java und die .NET-Controller-API belegen beide HTTP-Port 5105; der Proxy nutzt für .NET HTTPS (7102).
- `NET-Blueprint.Minimal` spricht einen eigenen Vertrag (`/persons` ohne `/api/v1`, keine
  Audit-Felder im Request, `POST` → 201 mit Person) und hat deshalb eine eigene Strategie.
- Die Backends erwarten Audit-Daten vom Client: `auditUserId` in `config.json` wird als
  `createdId`/`modifiedId` gesendet.

## Architektur

```
src/app/
  core/            Konfiguration, Backend-Auswahl, Fehler-Mapping, Notifications
  features/persons/
    domain/        Person/Address-Modell, Adress-Operationen (rein, getestet)
    data/          PersonApi-Abstraktion + Strategien je Backend-kind, Resolver
    state/         PersonsStore (Signals), Fehler → Snackbar
    ui/            Liste, Detail, Person-/Adress-Dialoge
  shared/          Bestätigungsdialog, Datums-Adapter (dd.MM.yyyy), Validatoren
```

Neues Backend-Protokoll: `PersonApiFactory` implementieren, in `person-api.providers.ts`
registrieren, Eintrag mit neuem `kind` in `config.json`.

Adressen werden über `PUT /persons/{id}` synchronisiert (neue: `addressId` = Empty-Guid,
fehlende werden gelöscht); Optimistic Locking über `version`.
