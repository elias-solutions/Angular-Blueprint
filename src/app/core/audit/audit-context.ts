import { Injectable, inject } from '@angular/core';
import { AppConfigStore } from '../config/app-config-store';

/** Supplies the user and timestamp the blueprints expect as client-side audit data. */
@Injectable({ providedIn: 'root' })
export class AuditContext {
  private readonly config = inject(AppConfigStore);

  userId(): string {
    return this.config.config().auditUserId;
  }

  now(): string {
    return new Date().toISOString();
  }
}
