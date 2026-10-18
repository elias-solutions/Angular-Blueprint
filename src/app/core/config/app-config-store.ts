import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from './app-config';

export const APP_CONFIG_URL = 'config.json';

/** Runtime configuration from `public/config.json`, loaded once before bootstrap. */
@Injectable({ providedIn: 'root' })
export class AppConfigStore {
  private readonly http = inject(HttpClient);
  private readonly state = signal<AppConfig | null>(null);

  config(): AppConfig {
    const config = this.state();
    if (!config) {
      throw new Error('App configuration has not been loaded.');
    }
    return config;
  }

  async load(): Promise<void> {
    this.state.set(await firstValueFrom(this.http.get<AppConfig>(APP_CONFIG_URL)));
  }

  /** For tests and hosts that provide the configuration in-process. */
  use(config: AppConfig): void {
    this.state.set(config);
  }
}
