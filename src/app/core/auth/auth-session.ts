import { Injectable, computed, inject } from '@angular/core';
import { KEYCLOAK_EVENT_SIGNAL } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { ROLES } from './roles';

/** The signed-in Keycloak user, re-read whenever Keycloak reports an event (login, token refresh...). */
@Injectable({ providedIn: 'root' })
export class AuthSession {
  private readonly keycloak = inject(Keycloak);
  private readonly events = inject(KEYCLOAK_EVENT_SIGNAL);

  private readonly token = computed(() => {
    this.events();
    return this.keycloak.tokenParsed;
  });

  readonly userName = computed(
    () => (this.token()?.['preferred_username'] as string | undefined) ?? '',
  );
  readonly isAdmin = computed(
    () => this.token()?.realm_access?.roles.includes(ROLES.admin) ?? false,
  );

  /** Keycloak user id (`sub`), sent as `createdId`/`modifiedId`. */
  userId(): string {
    const subject = this.keycloak.subject;
    if (!subject) {
      throw new Error('No user is signed in.');
    }
    return subject;
  }

  logout(): Promise<void> {
    return this.keycloak.logout({ redirectUri: window.location.origin });
  }
}
