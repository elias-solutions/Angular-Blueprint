import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChatPanelState } from '../features/chat/state/chat-panel-state';

@Component({
  selector: 'app-chat-toggle',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let label = (panel.open() ? 'chat.close' : 'chat.open') | transloco;
    <button
      mat-icon-button
      [class.active]="panel.open()"
      [attr.aria-pressed]="panel.open()"
      [attr.aria-label]="label"
      [matTooltip]="label"
      (click)="panel.toggle()"
    >
      <mat-icon>smart_toy</mat-icon>
    </button>
  `,
  styles: `
    .active {
      color: var(--mat-sys-primary);
    }
  `,
})
export class ChatToggle {
  protected readonly panel = inject(ChatPanelState);
}
