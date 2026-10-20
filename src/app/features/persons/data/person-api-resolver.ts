import { Injectable, computed, inject } from '@angular/core';
import { BackendSelection } from '../../../core/backend/backend-selection';
import { PERSON_API_FACTORIES, PersonApi } from './person-api';

@Injectable({ providedIn: 'root' })
export class PersonApiResolver {
  private readonly selection = inject(BackendSelection);
  private readonly factories = inject(PERSON_API_FACTORIES);

  readonly api = computed<PersonApi>(() => {
    const backend = this.selection.active();
    const factory = this.factories.find((candidate) => candidate.kind === backend.kind);
    if (!factory) {
      throw new Error(`No PersonApi registered for backend kind '${backend.kind}'.`);
    }
    return factory.create(backend);
  });
}
