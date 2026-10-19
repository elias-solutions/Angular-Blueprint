import { Injectable, signal } from '@angular/core';
import { AppConfig } from './app-config';

export const APP_CONFIG_URL = 'config.json';

/**
 * Loads `public/config.json` before bootstrap: Keycloak needs its realm before Angular's
 * providers (and thus `HttpClient`) exist.
 */
export async function fetchAppConfig(): Promise<AppConfig> {
  const response = await fetch(APP_CONFIG_URL);
  if (!response.ok) {
    throw new Error(`Could not load ${APP_CONFIG_URL} (HTTP ${response.status}).`);
  }
  return (await response.json()) as AppConfig;
}

/** Runtime configuration from `public/config.json`. */
@Injectable({ providedIn: 'root' })
export class AppConfigStore {
  private readonly state = signal<AppConfig | null>(null);

  config(): AppConfig {
    const config = this.state();
    if (!config) {
      throw new Error('App configuration has not been loaded.');
    }
    return config;
  }

  use(config: AppConfig): void {
    this.state.set(config);
  }
}
