import { TestBed } from '@angular/core/testing';
import { ChatConfig } from '../../../core/config/app-config';
import { AppConfigStore } from '../../../core/config/app-config-store';
import { CHAT_PROVIDER_STORAGE_KEY, ChatProviderSelection } from './chat-provider-selection';

const CHAT: ChatConfig = {
  defaultProviderId: 'local',
  providers: [
    {
      id: 'local',
      label: 'Lokal',
      baseUrl: '/llm/v1',
      model: 'qwen3:8b',
      capabilities: { images: false, pdf: false },
    },
    {
      id: 'openai',
      label: 'OpenAI',
      baseUrl: '/openai/v1',
      model: 'gpt-5-mini',
      capabilities: { images: true, pdf: true },
    },
  ],
};

describe('ChatProviderSelection', () => {
  const create = () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AppConfigStore, useValue: { config: () => ({ chat: CHAT }) } }],
    });
    return TestBed.inject(ChatProviderSelection);
  };

  beforeEach(() => localStorage.clear());

  it('starts with the configured default provider', () => {
    expect(create().active().id).toBe('local');
  });

  it('restores the previously selected provider', () => {
    localStorage.setItem(CHAT_PROVIDER_STORAGE_KEY, 'openai');

    expect(create().active().id).toBe('openai');
  });

  it('ignores a stored provider that is no longer configured', () => {
    localStorage.setItem(CHAT_PROVIDER_STORAGE_KEY, 'removed');

    expect(create().active().id).toBe('local');
  });

  it('switches and persists the selection', () => {
    const selection = create();

    selection.select('openai');

    expect(selection.active().model).toBe('gpt-5-mini');
    expect(localStorage.getItem(CHAT_PROVIDER_STORAGE_KEY)).toBe('openai');
  });

  it('rejects unknown providers', () => {
    expect(() => create().select('unknown')).toThrow("Unknown chat provider 'unknown'.");
  });
});
