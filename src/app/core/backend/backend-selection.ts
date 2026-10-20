import { Injectable, computed, inject, signal } from '@angular/core';
import { BackendConfig } from '../config/app-config';
import { AppConfigStore } from '../config/app-config-store';
import { readStored, writeStored } from '../../shared/storage/local-storage';

export const BACKEND_STORAGE_KEY = 'angular-blueprint.backend';

@Injectable({ providedIn: 'root' })
export class BackendSelection {
  private readonly config = inject(AppConfigStore).config();
  private readonly activeId = signal(this.initialId());

  readonly backends = this.config.backends;
  readonly active = computed(() => this.find(this.activeId())!);

  select(id: string): void {
    if (!this.find(id)) {
      throw new Error(`Unknown backend '${id}'.`);
    }
    this.activeId.set(id);
    writeStored(BACKEND_STORAGE_KEY, id);
  }

  private initialId(): string {
    const stored = readStored(BACKEND_STORAGE_KEY);
    return stored && this.find(stored) ? stored : this.config.defaultBackendId;
  }

  private find(id: string): BackendConfig | undefined {
    return this.config.backends.find((backend) => backend.id === id);
  }
}
