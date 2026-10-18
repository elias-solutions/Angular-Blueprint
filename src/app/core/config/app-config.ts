/**
 * Identifies the REST contract a backend speaks; each kind is served by its own
 * `PersonApi` strategy.
 * - `blueprint-api`: `/api/v1/persons` full CRUD (NET-Blueprint Api + Minimal.Api, Java-Blueprint).
 * - `blueprint-minimal`: `/persons` CRUD without client audit data (standalone NET-Blueprint.Minimal).
 */
export type BackendKind = 'blueprint-api' | 'blueprint-minimal';

export interface BackendConfig {
  readonly id: string;
  readonly label: string;
  readonly kind: BackendKind;
  /** Base URL of the persons resource's parent, e.g. `/backend/java/api/v1`. */
  readonly baseUrl: string;
}

export interface AppConfig {
  /** User id sent as `createdId`/`modifiedId`; the blueprints take audit data from the client. */
  readonly auditUserId: string;
  readonly defaultBackendId: string;
  readonly backends: readonly BackendConfig[];
}
