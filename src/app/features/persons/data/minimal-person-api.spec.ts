import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { BackendConfig } from '../../../core/config/app-config';
import { EMPTY_GUID, Person, PersonDraft } from '../domain/person';
import { MinimalPersonApiFactory } from './minimal-person-api';
import { PersonApi } from './person-api';

const BACKEND: BackendConfig = {
  id: 'net-minimal',
  label: '.NET Minimal',
  kind: 'blueprint-minimal',
  baseUrl: '/backend/net-minimal',
};

const DTO = {
  id: 'p1',
  firstName: 'Jonas',
  lastName: 'Elias',
  birthday: '1985-04-12',
  createdBy: 'u1',
  created: '2026-01-01T00:00:00+00:00',
  modifiedBy: null,
  modified: null,
  version: 'v1',
  addresses: [
    {
      id: 'a1',
      street: 'Hauptstrasse',
      number: '1',
      city: 'Olten',
      postalCode: '4600',
      createdBy: 'u1',
      created: '2026-01-01T00:00:00+00:00',
      modifiedBy: 'u2',
      modified: '2026-02-01T00:00:00+00:00',
      version: 'va1',
    },
  ],
};

describe('MinimalPersonApi', () => {
  let api: PersonApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(MinimalPersonApiFactory).create(BACKEND);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('supports writes', () => {
    expect(api.capabilities.write).toBe(true);
  });

  it('maps the legacy audit field names onto the domain model', async () => {
    const result = firstValueFrom(api.getById('p1'));

    http.expectOne('/backend/net-minimal/persons/p1').flush(DTO);

    expect(await result).toEqual({
      id: 'p1',
      firstName: 'Jonas',
      lastName: 'Elias',
      birthday: '1985-04-12',
      createdId: 'u1',
      createdDate: '2026-01-01T00:00:00+00:00',
      modifiedId: null,
      modifiedDate: null,
      version: 'v1',
      addresses: [
        {
          id: 'a1',
          street: 'Hauptstrasse',
          number: '1',
          city: 'Olten',
          postalCode: '4600',
          createdId: 'u1',
          createdDate: '2026-01-01T00:00:00+00:00',
          modifiedId: 'u2',
          modifiedDate: '2026-02-01T00:00:00+00:00',
          version: 'va1',
        },
      ],
    });
  });

  it('loads all persons', async () => {
    const result = firstValueFrom(api.getAll());

    http.expectOne('/backend/net-minimal/persons').flush([DTO]);

    expect((await result).map((p) => p.id)).toEqual(['p1']);
  });

  it('creates a person without audit data and returns the id of the created person', async () => {
    const draft: PersonDraft = {
      firstName: 'Anna',
      lastName: 'Muster',
      birthday: '1990-01-31',
      addresses: [{ id: null, street: 'Weg', number: '3', city: 'Basel', postalCode: '4000' }],
    };
    const result = firstValueFrom(api.create(draft));

    const req = http.expectOne('/backend/net-minimal/persons');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      firstName: 'Anna',
      lastName: 'Muster',
      birthday: '1990-01-31',
      addresses: [{ street: 'Weg', number: '3', city: 'Basel', postalCode: '4000' }],
    });
    req.flush({ ...DTO, id: 'new-id' }, { status: 201, statusText: 'Created' });

    expect(await result).toBe('new-id');
  });

  it('updates a person with versions and synchronizes addresses', async () => {
    const original = await loaded(DTO);
    const draft: PersonDraft = {
      firstName: 'Jonas',
      lastName: 'Elias-Muster',
      birthday: '1985-04-12',
      addresses: [
        { id: 'a1', street: 'Neue Strasse', number: '5', city: 'Olten', postalCode: '4600' },
        { id: null, street: 'Weg', number: '3', city: 'Basel', postalCode: '4000' },
      ],
    };
    const result = firstValueFrom(api.update(original, draft));

    const req = http.expectOne('/backend/net-minimal/persons/p1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      id: 'p1',
      firstName: 'Jonas',
      lastName: 'Elias-Muster',
      birthday: '1985-04-12',
      version: 'v1',
      addresses: [
        {
          addressId: 'a1',
          street: 'Neue Strasse',
          number: '5',
          city: 'Olten',
          postalCode: '4600',
          version: 'va1',
        },
        {
          addressId: EMPTY_GUID,
          street: 'Weg',
          number: '3',
          city: 'Basel',
          postalCode: '4000',
          version: EMPTY_GUID,
        },
      ],
    });
    req.flush(null);

    await expect(result).resolves.toBeUndefined();
  });

  it('deletes a person by id', async () => {
    const result = firstValueFrom(api.delete('p1'));

    const req = http.expectOne('/backend/net-minimal/persons/p1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await expect(result).resolves.toBeUndefined();
  });

  async function loaded(dto: typeof DTO): Promise<Person> {
    const person = firstValueFrom(api.getById(dto.id));
    http.expectOne(`/backend/net-minimal/persons/${dto.id}`).flush(dto);
    return person;
  }
});
