import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatPanelState {
  private readonly openState = signal(false);

  readonly open = this.openState.asReadonly();

  toggle(): void {
    this.openState.update((open) => !open);
  }

  close(): void {
    this.openState.set(false);
  }
}
