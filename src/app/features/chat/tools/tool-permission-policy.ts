import { Injectable, inject } from '@angular/core';
import { AuthSession } from '../../../core/auth/auth-session';
import { PersonApiResolver } from '../../persons/data/person-api-resolver';
import { ToolPermission } from './chat-tool';

@Injectable({ providedIn: 'root' })
export class ToolPermissionPolicy {
  private readonly auth = inject(AuthSession);
  private readonly resolver = inject(PersonApiResolver);

  allows(permission: ToolPermission): boolean {
    const backendWritable = this.resolver.api().capabilities.write;
    const rules: Readonly<Record<ToolPermission, () => boolean>> = {
      read: () => true,
      write: () => backendWritable && this.auth.canWrite(),
      delete: () => backendWritable && this.auth.canDelete(),
    };
    return rules[permission]();
  }
}
