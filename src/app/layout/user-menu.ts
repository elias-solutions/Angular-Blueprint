import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthSession } from '../core/auth/auth-session';

@Component({
  selector: 'app-user-menu',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="user" [matTooltip]="'auth.signedInAs' | transloco: { name: auth.userName() }">
      <mat-icon>account_circle</mat-icon>
      <span>{{ auth.userName() }}</span>
    </span>
    <button
      mat-icon-button
      (click)="auth.logout()"
      [attr.aria-label]="'auth.logout' | transloco"
      [matTooltip]="'auth.logout' | transloco"
    >
      <mat-icon>logout</mat-icon>
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .user {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
    }
  `,
})
export class UserMenu {
  protected readonly auth = inject(AuthSession);
}
