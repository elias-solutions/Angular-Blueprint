import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEvent, KeycloakEventType } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { AuthSession } from './auth-session';

type FakeKeycloak = Pick<Keycloak, 'tokenParsed' | 'subject'> & { logout: jest.Mock };

describe('AuthSession', () => {
  let keycloak: FakeKeycloak;
  let events: ReturnType<typeof signal<KeycloakEvent>>;
  let session: AuthSession;

  beforeEach(() => {
    keycloak = {
      subject: 'sub-1',
      tokenParsed: { preferred_username: 'user', realm_access: { roles: ['standard'] } },
      logout: jest.fn().mockResolvedValue(undefined),
    };
    events = signal<KeycloakEvent>({ type: KeycloakEventType.Ready, args: true });
    TestBed.configureTestingModule({
      providers: [
        { provide: Keycloak, useValue: keycloak },
        { provide: KEYCLOAK_EVENT_SIGNAL, useValue: events },
      ],
    });
    session = TestBed.inject(AuthSession);
  });

  it('exposes the signed-in user', () => {
    expect(session.userName()).toBe('user');
    expect(session.userId()).toBe('sub-1');
  });

  it('treats a standard user as non-admin', () => {
    expect(session.isAdmin()).toBe(false);
  });

  it('re-reads the token on Keycloak events', () => {
    keycloak.tokenParsed = { preferred_username: 'admin', realm_access: { roles: ['admin'] } };
    events.set({ type: KeycloakEventType.AuthRefreshSuccess });

    expect(session.isAdmin()).toBe(true);
    expect(session.userName()).toBe('admin');
  });

  it('refuses audit data without a signed-in user', () => {
    keycloak.subject = undefined;

    expect(() => session.userId()).toThrow('No user is signed in.');
  });

  it('logs out back to the app', async () => {
    await session.logout();

    expect(keycloak.logout).toHaveBeenCalledWith({ redirectUri: window.location.origin });
  });
});
