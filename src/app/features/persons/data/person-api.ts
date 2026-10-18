import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendConfig, BackendKind } from '../../../core/config/app-config';
import { Person, PersonDraft } from '../domain/person';

export interface PersonApiCapabilities {
  readonly write: boolean;
}

/** Backend-agnostic access to persons; one strategy per `BackendKind`. */
export interface PersonApi {
  readonly capabilities: PersonApiCapabilities;
  getAll(): Observable<Person[]>;
  getById(id: string): Observable<Person>;
  /** Emits the id of the created person. */
  create(draft: PersonDraft): Observable<string>;
  /** Replaces person data and synchronizes its addresses (missing ones are deleted). */
  update(original: Person, draft: PersonDraft): Observable<void>;
  delete(id: string): Observable<void>;
}

export interface PersonApiFactory {
  readonly kind: BackendKind;
  create(backend: BackendConfig): PersonApi;
}

export const PERSON_API_FACTORIES = new InjectionToken<readonly PersonApiFactory[]>(
  'PERSON_API_FACTORIES',
);
