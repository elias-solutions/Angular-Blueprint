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
| `net-api` | NET-Blueprint / Api (Controller) | `blueprint-api` | `/backend/net-api` → http://localhost:5102 |
| `net-minimal-api` | NET-Blueprint / Minimal.Api | `blueprint-api` | `/backend/net-minimal-api` → http://localhost:5206 |

- Keines der Backends erlaubt CORS → im Dev-Betrieb läuft alles über den Proxy. Für ein Deployment
  `baseUrl` auf die echte URL setzen und im Backend CORS freischalten (oder Reverse-Proxy).
- Die Ziele sind die HTTP-Ports aus `launchSettings.json` / `application.properties`; `docker-compose.yml`
  mappt die Container auf dieselben Host-Ports → der Proxy funktioniert lokal wie gegen die Container.
- Anmeldung über Keycloak (`auth` in `config.json`, Realm `blueprint` aus dem Compose, Port 8180):
  `reader`/`reader` darf lesen, `writer`/`writer` darf zusätzlich anlegen und ändern, `admin`/`admin`
  darf zusätzlich löschen. Die Keycloak-User-Id wird
  als `createdId`/`modifiedId` gesendet.

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
