import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { NotificationService } from '../../../core/notification/notification.service';
import { Person, PersonDraft } from '../domain/person';
import { PersonApi } from '../data/person-api';
import { PersonApiResolver } from '../data/person-api-resolver';
import { PersonsStore } from './persons-store';

const person = (id: string, lastName = 'Elias'): Person => ({
  id,
  firstName: 'Jonas',
  lastName,
  birthday: '1985-04-12',
  gender: null,
  description: null,
  email: null,
  phone: null,
  type: null,
  addresses: [],
  createdId: 'u',
  createdDate: '2026-01-01T00:00:00Z',
  modifiedId: null,
  modifiedDate: null,
  version: 'v',
});

const DRAFT: PersonDraft = {
  firstName: 'Anna',
  lastName: 'Muster',
  birthday: '1990-01-01',
  gender: null,
  description: null,
  email: null,
  phone: null,
  type: null,
  addresses: [],
};

class FakePersonApi implements PersonApi {
  readonly capabilities = { write: true };
  persons: Person[] = [person('p1')];
  failWith: unknown = null;

  private respond<T>(value: T): Observable<T> {
    return this.failWith ? throwError(() => this.failWith) : of(value);
  }
  getAll = jest.fn(() => this.respond([...this.persons]));
  getById = jest.fn((id: string) => this.respond(this.persons.find((p) => p.id === id)!));
  create = jest.fn(() => {
    this.persons.push(person('p2', 'Muster'));
    return this.respond('p2');
  });
  update = jest.fn(() => this.respond(undefined));
  delete = jest.fn((id: string) => {
    this.persons = this.persons.filter((p) => p.id !== id);
    return this.respond(undefined);
  });
}

describe('PersonsStore', () => {
  let api: FakePersonApi;
  let store: PersonsStore;
  let notifications: { success: jest.Mock; error: jest.Mock };

  beforeEach(() => {
    api = new FakePersonApi();
    notifications = { success: jest.fn(), error: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        PersonsStore,
        { provide: PersonApiResolver, useValue: { api: signal(api) } },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    store = TestBed.inject(PersonsStore);
  });

  it('loads persons', async () => {
    await store.load();

    expect(store.persons().map((p) => p.id)).toEqual(['p1']);
    expect(store.loading()).toBe(false);
  });

  it('reports load failures and clears the list', async () => {
    await store.load();
    api.failWith = new HttpErrorResponse({ status: 0 });

    await store.load();

    expect(store.persons()).toEqual([]);
    expect(notifications.error).toHaveBeenCalledWith('Backend nicht erreichbar.');
  });

  it('loads a single person', async () => {
    await store.loadPerson('p1');

    expect(store.selected()?.id).toBe('p1');
  });

  it('creates a person, reloads the list and returns the new id', async () => {
    const id = await store.create(DRAFT);

    expect(id).toBe('p2');
    expect(api.create).toHaveBeenCalledWith(DRAFT);
    expect(store.persons().map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(notifications.success).toHaveBeenCalledWith('Anna Muster wurde erstellt.');
  });

  it('returns null when creating fails', async () => {
    api.failWith = new HttpErrorResponse({ status: 400, error: { title: 'Bad', status: 400 } });

    expect(await store.create(DRAFT)).toBeNull();
    expect(notifications.error).toHaveBeenCalledWith('Bad');
  });

  it('updates a person and refreshes it in the list and the selection', async () => {
    await store.load();
    const original = person('p1');
    api.persons = [person('p1', 'Muster')];

    const ok = await store.update(original, DRAFT);

    expect(ok).toBe(true);
    expect(api.update).toHaveBeenCalledWith(original, DRAFT);
    expect(api.getAll).toHaveBeenCalledTimes(1);
    expect(store.selected()?.lastName).toBe('Muster');
    expect(store.persons().map((p) => p.lastName)).toEqual(['Muster']);
    expect(notifications.success).toHaveBeenCalledWith('Anna Muster wurde gespeichert.');
  });

  it('removes a person and drops it from the list', async () => {
    await store.load();

    const ok = await store.remove(person('p1'));

    expect(ok).toBe(true);
    expect(store.persons()).toEqual([]);
    expect(notifications.success).toHaveBeenCalledWith('Jonas Elias wurde gelöscht.');
  });
});
