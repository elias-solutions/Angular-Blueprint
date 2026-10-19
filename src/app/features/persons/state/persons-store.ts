import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiErrorMapper } from '../../../core/http/api-error-mapper';
import { NotificationService } from '../../../core/notification/notification.service';
import { Person, PersonDraft, fullName } from '../domain/person';
import { PersonApiResolver } from '../data/person-api-resolver';

/** Feature state for persons: talks to the active `PersonApi` and reports outcomes to the user. */
@Injectable()
export class PersonsStore {
  private readonly resolver = inject(PersonApiResolver);
  private readonly notifications = inject(NotificationService);
  private readonly errors = inject(ApiErrorMapper);
  private readonly transloco = inject(TranslocoService);

  private readonly personsState = signal<readonly Person[]>([]);
  private readonly selectedState = signal<Person | null>(null);
  private readonly pending = signal(0);

  readonly persons = this.personsState.asReadonly();
  readonly selected = this.selectedState.asReadonly();
  readonly loading = computed(() => this.pending() > 0);
  /** Changes whenever the user switches backends; pages reload on it. */
  readonly activeApi = this.resolver.api;
  readonly canWrite = computed(() => this.activeApi().capabilities.write);

  async load(): Promise<void> {
    const result = await this.run(this.api().getAll());
    this.personsState.set(result.ok ? result.value : []);
  }

  async loadPerson(id: string): Promise<void> {
    const result = await this.run(this.api().getById(id));
    this.selectedState.set(result.ok ? result.value : null);
  }

  /** Returns the new person's id, or `null` if creation failed. */
  async create(draft: PersonDraft): Promise<string | null> {
    const result = await this.run(this.api().create(draft));
    if (!result.ok) {
      return null;
    }
    this.notify('created', fullName(draft));
    await this.load();
    return result.value;
  }

  async update(original: Person, draft: PersonDraft): Promise<boolean> {
    const { ok } = await this.run(this.api().update(original, draft));
    if (ok) {
      this.notify('saved', fullName(draft));
      await this.refresh(original.id);
    }
    return ok;
  }

  async remove(person: Person): Promise<boolean> {
    const { ok } = await this.run(this.api().delete(person.id));
    if (ok) {
      this.notify('deleted', fullName(person));
      this.personsState.update((persons) => persons.filter((p) => p.id !== person.id));
      if (this.selectedState()?.id === person.id) {
        this.selectedState.set(null);
      }
    }
    return ok;
  }

  /** Reloads one person (new version) into the selection and the list without refetching all. */
  private async refresh(id: string): Promise<void> {
    const result = await this.run(this.api().getById(id));
    if (!result.ok) {
      return;
    }
    this.selectedState.set(result.value);
    this.personsState.update((persons) =>
      persons.map((person) => (person.id === id ? result.value : person)),
    );
  }

  private api() {
    return this.activeApi();
  }

  private notify(outcome: 'created' | 'saved' | 'deleted', name: string): void {
    this.notifications.success(
      this.transloco.translate(`persons.notifications.${outcome}`, { name }),
    );
  }

  /** Runs a backend call, reporting failures to the user instead of rethrowing them. */
  private async run<T>(request: Observable<T>): Promise<Result<T>> {
    this.pending.update((count) => count + 1);
    try {
      return { ok: true, value: await firstValueFrom(request) };
    } catch (error) {
      this.notifications.error(this.errors.toMessage(error));
      return { ok: false };
    } finally {
      this.pending.update((count) => count - 1);
    }
  }
}

type Result<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };
