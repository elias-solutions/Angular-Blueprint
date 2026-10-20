export type BackendKind = 'blueprint-api';

export interface BackendConfig {
  readonly id: string;
  readonly label: string;
  readonly kind: BackendKind;
  readonly baseUrl: string;
}

export interface AuthConfig {
  readonly url: string;
  readonly realm: string;
  readonly clientId: string;
}

export interface AppConfig {
  readonly auth: AuthConfig;
  readonly defaultBackendId: string;
  readonly backends: readonly BackendConfig[];
}
