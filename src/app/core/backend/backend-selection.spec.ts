import { TestBed } from '@angular/core/testing';
import { AppConfig } from '../config/app-config';
import { AppConfigStore } from '../config/app-config-store';
import { BACKEND_STORAGE_KEY, BackendSelection } from './backend-selection';

const CONFIG: AppConfig = {
  auth: { url: 'http://localhost:8180', realm: 'blueprint', clientId: 'blueprint-angular' },
  chat: { defaultProviderId: 'local', providers: [] },
  defaultBackendId: 'java',
  backends: [
    { id: 'net-api', label: '.NET', kind: 'blueprint-api', baseUrl: '/backend/net-api/api/v1' },
    { id: 'java', label: 'Java', kind: 'blueprint-api', baseUrl: '/backend/java/api/v1' },
  ],
};

describe('BackendSelection', () => {
  const create = () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AppConfigStore, useValue: { config: () => CONFIG } }],
    });
    return TestBed.inject(BackendSelection);
  };

  beforeEach(() => localStorage.clear());

  it('starts with the configured default backend', () => {
    expect(create().active().id).toBe('java');
  });

  it('restores the previously selected backend', () => {
    localStorage.setItem(BACKEND_STORAGE_KEY, 'net-api');

    expect(create().active().id).toBe('net-api');
  });

  it('ignores a stored backend that is no longer configured', () => {
    localStorage.setItem(BACKEND_STORAGE_KEY, 'removed');

    expect(create().active().id).toBe('java');
  });

  it('switches and persists the selection', () => {
    const selection = create();

    selection.select('net-api');

    expect(selection.active().id).toBe('net-api');
    expect(localStorage.getItem(BACKEND_STORAGE_KEY)).toBe('net-api');
  });

  it('rejects unknown backends', () => {
    expect(() => create().select('unknown')).toThrow("Unknown backend 'unknown'.");
  });
});
