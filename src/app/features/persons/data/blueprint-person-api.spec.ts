import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuditContext } from '../../../core/audit/audit-context';
import { BackendConfig } from '../../../core/config/app-config';
import { EMPTY_GUID, Person, PersonDraft } from '../domain/person';
import { BlueprintPersonApiFactory } from './blueprint-person-api';
import { PersonApi } from './person-api';

const USER = 'e3d3d338-2053-4ce9-877d-de4563fe321c';
const NOW = '2026-10-18T10:00:00.000Z';
const BACKEND: BackendConfig = {
  id: 'java',
  label: 'Java',
  kind: 'blueprint-api',
  baseUrl: '/backend/java/api/v1',
};

const audit = (version: string) => ({
  createdId: 'creator',
  createdDate: '2026-01-01T00:00:00+00:00',
  modifiedId: null,
  modifiedDate: null,
  version,
});

const PERSON: Person = {
  id: 'p1',
  firstName: 'Jonas',
  lastName: 'Elias',
  birthday: '1985-04-12',
  gender: 'Male',
  description: 'Senior Consultant',
  email: 'jonas.elias@example.com',
  phone: '+41 62 000 00 00',
  type: 'Employee',
  addresses: [
    {
      id: 'a1',
      street: 'Hauptstrasse',
      number: '1',
      city: 'Olten',
      postalCode: '4600',
      ...audit('va1'),
    },
    { id: 'a2', street: 'Gasse', number: '2', city: 'Bern', postalCode: '3000', ...audit('va2') },
  ],
  ...audit('vp1'),
};

describe('BlueprintPersonApi', () => {
  let api: PersonApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuditContext, useValue: { userId: () => USER, now: () => NOW } },
      ],
    });
    api = TestBed.inject(BlueprintPersonApiFactory).create(BACKEND);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('supports writes', () => {
    expect(api.capabilities.write).toBe(true);
  });

  it('loads all persons from the versioned persons resource', async () => {
    const result = firstValueFrom(api.getAll());

    const req = http.expectOne('/backend/java/api/v1/persons');
    expect(req.request.method).toBe('GET');
    req.flush([PERSON]);

    expect(await result).toEqual([PERSON]);
  });

  it('normalizes missing addresses to an empty list', async () => {
    const result = firstValueFrom(api.getById('p1'));

    http.expectOne('/backend/java/api/v1/persons/p1').flush({ ...PERSON, addresses: null });

    expect((await result).addresses).toEqual([]);
  });

  it('creates a person with client-side audit data on person and addresses', async () => {
    const draft: PersonDraft = {
      firstName: 'Anna',
      lastName: 'Muster',
      birthday: null,
      gender: 'Female',
      description: null,
      email: 'anna@example.com',
      phone: null,
      type: 'Freelancer',
      addresses: [{ id: null, street: 'Weg', number: '3', city: 'Basel', postalCode: '4000' }],
    };
    const result = firstValueFrom(api.create(draft));

    const req = http.expectOne('/backend/java/api/v1/persons');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      firstName: 'Anna',
      lastName: 'Muster',
      birthday: null,
      gender: 'Female',
      description: null,
      email: 'anna@example.com',
      phone: null,
      type: 'Freelancer',
      createdId: USER,
      createdDate: NOW,
      addresses: [
        {
          street: 'Weg',
          number: '3',
          city: 'Basel',
          postalCode: '4000',
          createdId: USER,
          createdDate: NOW,
        },
      ],
    });
    req.flush({ id: 'new-id' });

    expect(await result).toBe('new-id');
  });

  it('updates a person keeping created audit and version, and synchronizes addresses', async () => {
    const draft: PersonDraft = {
      firstName: 'Jonas',
      lastName: 'Elias-Muster',
      birthday: '1985-04-12',
      gender: 'Male',
      description: 'Architekt',
      email: 'jonas.elias@example.com',
      phone: '+41 62 000 00 00',
      type: 'Freelancer',
      addresses: [
        { id: 'a1', street: 'Neue Strasse', number: '5', city: 'Olten', postalCode: '4600' },
        { id: null, street: 'Weg', number: '3', city: 'Basel', postalCode: '4000' },
      ],
    };
    const result = firstValueFrom(api.update(PERSON, draft));

    const req = http.expectOne('/backend/java/api/v1/persons/p1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      id: 'p1',
      firstName: 'Jonas',
      lastName: 'Elias-Muster',
      birthday: '1985-04-12',
      gender: 'Male',
      description: 'Architekt',
      email: 'jonas.elias@example.com',
      phone: '+41 62 000 00 00',
      type: 'Freelancer',
      createdId: 'creator',
      createdDate: '2026-01-01T00:00:00+00:00',
      modifiedId: USER,
      modifiedDate: NOW,
      version: 'vp1',
      addresses: [
        {
          addressId: 'a1',
          street: 'Neue Strasse',
          number: '5',
          city: 'Olten',
          postalCode: '4600',
          createdId: 'creator',
          createdDate: '2026-01-01T00:00:00+00:00',
          modifiedId: USER,
          modifiedDate: NOW,
          version: 'va1',
        },
        {
          addressId: EMPTY_GUID,
          street: 'Weg',
          number: '3',
          city: 'Basel',
          postalCode: '4000',
          createdId: USER,
          createdDate: NOW,
          modifiedId: USER,
          modifiedDate: NOW,
          version: EMPTY_GUID,
        },
      ],
    });
    req.flush(null);

    await expect(result).resolves.toBeUndefined();
  });

  it('deletes a person by id', async () => {
    const result = firstValueFrom(api.delete('p1'));

    const req = http.expectOne('/backend/java/api/v1/persons/p1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await expect(result).resolves.toBeUndefined();
  });
});
