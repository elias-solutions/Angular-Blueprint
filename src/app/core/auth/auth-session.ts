import { Injectable, computed, inject } from '@angular/core';
import { KEYCLOAK_EVENT_SIGNAL } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { ROLES } from './roles';

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
  readonly canWrite = computed(() => this.hasAnyRole(ROLES.writer, ROLES.admin));
  readonly canDelete = computed(() => this.hasAnyRole(ROLES.admin));

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

  private hasAnyRole(...roles: string[]): boolean {
    const granted = this.token()?.realm_access?.roles ?? [];
    return roles.some((role) => granted.includes(role));
  }
}
