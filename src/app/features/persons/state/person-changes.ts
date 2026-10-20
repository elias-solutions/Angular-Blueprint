import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PersonChanges {
  private readonly revisionState = signal(0);

  readonly revision = this.revisionState.asReadonly();

  notify(): void {
    this.revisionState.update((revision) => revision + 1);
  }
}
