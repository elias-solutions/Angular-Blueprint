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

export interface ChatProviderCapabilities {
  readonly images: boolean;
  readonly pdf: boolean;
}

export interface ChatProviderConfig {
  readonly id: string;
  readonly label: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly reasoningEffort?: string;
  readonly capabilities: ChatProviderCapabilities;
}

export interface ChatConfig {
  readonly defaultProviderId: string;
  readonly providers: readonly ChatProviderConfig[];
}

export interface AppConfig {
  readonly auth: AuthConfig;
  readonly chat: ChatConfig;
  readonly defaultBackendId: string;
  readonly backends: readonly BackendConfig[];
}
