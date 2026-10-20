import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChatPanelState } from './features/chat/state/chat-panel-state';
import { ChatPanel } from './features/chat/ui/chat-panel/chat-panel';
import { BackendSwitcher } from './layout/backend-switcher';
import { ChatToggle } from './layout/chat-toggle';
import { LanguageSwitcher } from './layout/language-switcher';
import { UserMenu } from './layout/user-menu';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    TranslocoPipe,
    BackendSwitcher,
    ChatPanel,
    ChatToggle,
    LanguageSwitcher,
    UserMenu,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly chatPanel = inject(ChatPanelState);
}
