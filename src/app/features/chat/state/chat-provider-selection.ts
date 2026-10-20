import { Injectable, computed, inject, signal } from '@angular/core';
import { ChatProviderConfig } from '../../../core/config/app-config';
import { AppConfigStore } from '../../../core/config/app-config-store';
import { readStored, writeStored } from '../../../shared/storage/local-storage';

export const CHAT_PROVIDER_STORAGE_KEY = 'angular-blueprint.chat-provider';

@Injectable({ providedIn: 'root' })
export class ChatProviderSelection {
  private readonly config = inject(AppConfigStore).config().chat;
  private readonly activeId = signal(this.initialId());

  readonly providers = this.config.providers;
  readonly active = computed(() => this.find(this.activeId())!);

  select(id: string): void {
    if (!this.find(id)) {
      throw new Error(`Unknown chat provider '${id}'.`);
    }
    this.activeId.set(id);
    writeStored(CHAT_PROVIDER_STORAGE_KEY, id);
  }

  private initialId(): string {
    const stored = readStored(CHAT_PROVIDER_STORAGE_KEY);
    return stored && this.find(stored) ? stored : this.config.defaultProviderId;
  }

  private find(id: string): ChatProviderConfig | undefined {
    return this.config.providers.find((provider) => provider.id === id);
  }
}
