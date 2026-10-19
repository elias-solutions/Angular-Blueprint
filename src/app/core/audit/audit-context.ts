import { Injectable, inject } from '@angular/core';
import { AuthSession } from '../auth/auth-session';

/** Supplies the user and timestamp the blueprints expect as client-side audit data. */
@Injectable({ providedIn: 'root' })
export class AuditContext {
  private readonly auth = inject(AuthSession);

  userId(): string {
    return this.auth.userId();
  }

  now(): string {
    return new Date().toISOString();
  }
}
