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

Der KI-Assistent spricht über das KI-Gateway `Python-Blueprint`: `/backend/ai` → http://localhost:5300.

- Keines der Backends erlaubt CORS → im Dev-Betrieb läuft alles über den Proxy. Für ein Deployment
  `baseUrl` auf die echte URL setzen und im Backend CORS freischalten (oder Reverse-Proxy).
- Die Ziele sind die HTTP-Ports aus `launchSettings.json` / `application.properties`; `docker-compose.yml`
  mappt die Container auf dieselben Host-Ports → der Proxy funktioniert lokal wie gegen die Container.
- Anmeldung über Keycloak (`auth` in `config.json`, Realm `blueprint` aus dem Compose, Port 8180):
  `reader`/`reader` darf lesen, `writer`/`writer` darf zusätzlich anlegen und ändern, `admin`/`admin`
  darf zusätzlich löschen. Die Keycloak-User-Id wird
  als `createdId`/`modifiedId` gesendet.

## KI-Assistent

Seitenpanel rechts (Toolbar → Roboter-Symbol). Ein LLM – lokal (`qwen3:8b` über Ollama) oder bei
OpenAI, im Panel umschaltbar, beide über das KI-Gateway `Python-Blueprint` – beantwortet Fragen und führt Aktionen über Tools aus – mit genau den Rechten des
angemeldeten Benutzers:

| Rolle | Tools |
|---|---|
| `reader` | `search_persons`, `get_person` |
| `writer` | zusätzlich `create_person`, `update_person`, `add_address`, `remove_address` |
| `admin` | zusätzlich `delete_person` |

- Konfiguration in `config.json` → `chat.providers` (`baseUrl`, `model`, optional `reasoningEffort`;
  `none` schaltet das Thinking von Qwen ab und ist ~3× schneller; `capabilities` legt fest, ob das
  Modell Bilder/PDFs lesen kann) und `chat.defaultProviderId`. Die Auswahl im Panel wird im
  `localStorage` gemerkt. `baseUrl` zeigt auf `/backend/ai/api/v1/providers/{ollama|openai}`.
- Das Gateway prüft das Keycloak-Token (wird wie bei allen `/backend/`-URLs mitgeschickt), lässt
  nur freigegebene Modelle zu und ergänzt den OpenAI-Key serverseitig – der Key erreicht nie den
  Browser. Key setzen: `Init-Blueprint/.env` (siehe README dort). Neue Modelle müssen in
  `config.json` **und** in der Allowlist des Gateways (`OPENAI_MODELS`/`OLLAMA_MODELS`) stehen.
- Dateien anhängen (Büroklammer oder Drag & Drop) und im Text sagen, was damit passieren soll.
  Text (txt, md, csv, tsv, json, xml, yaml, log; max. 200 KB) geht bei allen Modellen als Text mit.
  Bilder (png, jpeg, webp, gif; max. 10 MB) und PDFs (max. 20 MB) nur bei Modellen mit passender
  `capability`. Achtung: Ollama läuft mit `OLLAMA_CONTEXT_LENGTH` 8192 – grosse Textdateien sprengen
  den Kontext.
- Die Tools rufen dieselbe `PersonApi` wie die Oberfläche auf (Bearer-Token des Benutzers) – das
  Backend prüft die Rechte also zusätzlich. Nicht erlaubte Tools werden dem Modell gar nicht
  angeboten und bei einem Aufruf trotzdem abgelehnt.
- Die Tool-Schleife läuft im Browser; das Token geht an das Gateway, aber nie an das LLM.

## Architektur

```
src/app/
  core/            Konfiguration, Backend-Auswahl, Fehler-Mapping, Notifications
  features/chat/
    attachments/   AttachmentFormat-Strategien (Text/Bild/PDF), AttachmentReader
    data/          LlmClient-Abstraktion + OpenAiLlmClient (OpenAI-kompatible API)
    tools/         ChatTool-Strategien (Person-Tools), ToolPermissionPolicy, ChatToolRegistry
    state/         ChatSession (LLM ↔ Tool-Schleife), System-Prompt, Panel-Zustand,
                   Modell-Auswahl, anstehende Anhänge
    ui/            ChatPanel (per @defer erst beim Öffnen geladen)
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
