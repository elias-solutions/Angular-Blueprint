import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { Person, PersonDraft } from '../../persons/domain/person';
import { PersonApi } from '../../persons/data/person-api';
import { PersonApiResolver } from '../../persons/data/person-api-resolver';
import { PersonChanges } from '../../persons/state/person-changes';
import { ChatTool } from './chat-tool';
import {
  AddAddressTool,
  CreatePersonTool,
  DeletePersonTool,
  GetPersonTool,
  RemoveAddressTool,
  SearchPersonsTool,
  UpdatePersonTool,
} from './person-tools';
import { ToolArgumentError, ToolArguments } from './tool-arguments';

const audit = {
  createdId: 'u',
  createdDate: '2026-01-01T00:00:00Z',
  modifiedId: null,
  modifiedDate: null,
  version: 'v',
};

const ANNA: Person = {
  id: 'p1',
  firstName: 'Anna',
  lastName: 'Muster',
  birthday: '1990-01-01',
  gender: 'Female',
  description: 'Beraterin',
  email: 'anna@example.com',
  phone: null,
  type: 'Employee',
  addresses: [
    { id: 'a1', street: 'Weg', number: '3', city: 'Basel', postalCode: '4000', ...audit },
  ],
  ...audit,
};

const PETER: Person = {
  ...ANNA,
  id: 'p2',
  firstName: 'Peter',
  lastName: 'Keller',
  gender: 'Male',
  email: null,
  type: 'Freelancer',
  addresses: [],
};

class FakePersonApi implements PersonApi {
  readonly capabilities = { write: true };
  persons: Person[] = [ANNA, PETER];

  getAll = jest.fn(() => of([...this.persons]));
  getById = jest.fn((id: string): Observable<Person> => {
    const person = this.persons.find((p) => p.id === id);
    return person ? of(person) : throwError(() => new HttpErrorResponse({ status: 404 }));
  });
  create = jest.fn((_draft: PersonDraft) => of('new-id'));
  update = jest.fn((_original: Person, _draft: PersonDraft) => of(undefined));
  delete = jest.fn((_id: string) => of(undefined));
}

const run = (tool: ChatTool, args: object) =>
  tool.execute(ToolArguments.parse(JSON.stringify(args)));

describe('person chat tools', () => {
  let api: FakePersonApi;
  let changes: PersonChanges;

  beforeEach(() => {
    api = new FakePersonApi();
    TestBed.configureTestingModule({
      providers: [{ provide: PersonApiResolver, useValue: { api: signal(api) } }],
    });
    changes = TestBed.inject(PersonChanges);
  });

  const tool = <T extends ChatTool>(type: new () => T): T => TestBed.inject(type);

  describe('search_persons', () => {
    it('lists everyone without a query', async () => {
      const result = await run(tool(SearchPersonsTool), {});

      expect(result).toEqual({
        count: 2,
        persons: [
          {
            id: 'p1',
            name: 'Anna Muster',
            birthday: '1990-01-01',
            type: 'Employee',
            email: 'anna@example.com',
            phone: null,
            cities: ['Basel'],
          },
          {
            id: 'p2',
            name: 'Peter Keller',
            birthday: '1990-01-01',
            type: 'Freelancer',
            email: null,
            phone: null,
            cities: [],
          },
        ],
      });
    });

    it('matches name, contact and address case-insensitively', async () => {
      const byName = (await run(tool(SearchPersonsTool), { query: 'keller' })) as { count: number };
      const byCity = (await run(tool(SearchPersonsTool), { query: 'BASEL' })) as { count: number };
      const none = (await run(tool(SearchPersonsTool), { query: 'Zürich' })) as { count: number };

      expect(byName.count).toBe(1);
      expect(byCity.count).toBe(1);
      expect(none.count).toBe(0);
    });

    it('is a read tool', () => {
      expect(tool(SearchPersonsTool).permission).toBe('read');
    });
  });

  describe('get_person', () => {
    it('returns the profile with addresses but without audit data', async () => {
      const result = await run(tool(GetPersonTool), { id: 'p1' });

      expect(result).toEqual({
        id: 'p1',
        firstName: 'Anna',
        lastName: 'Muster',
        birthday: '1990-01-01',
        gender: 'Female',
        description: 'Beraterin',
        email: 'anna@example.com',
        phone: null,
        type: 'Employee',
        addresses: [{ id: 'a1', street: 'Weg', number: '3', postalCode: '4000', city: 'Basel' }],
      });
    });

    it('requires an id', async () => {
      await expect(run(tool(GetPersonTool), {})).rejects.toThrow(ToolArgumentError);
    });
  });

  describe('create_person', () => {
    it('creates a person without addresses and announces the change', async () => {
      const result = await run(tool(CreatePersonTool), {
        firstName: 'Lisa',
        lastName: 'Meier',
        gender: 'female',
        type: 'employee',
        birthday: '1988-07-15',
      });

      expect(api.create).toHaveBeenCalledWith({
        firstName: 'Lisa',
        lastName: 'Meier',
        birthday: '1988-07-15',
        gender: 'Female',
        description: null,
        email: null,
        phone: null,
        type: 'Employee',
        addresses: [],
      });
      expect(result).toEqual({ created: 'Lisa Meier', id: 'new-id' });
      expect(changes.revision()).toBe(1);
    });

    it('creates a person together with addresses in one call', async () => {
      await run(tool(CreatePersonTool), {
        firstName: 'Lisa',
        lastName: 'Meier',
        addresses: [{ street: 'Bahnhofstrasse', number: '10', postalCode: '8001', city: 'Zürich' }],
      });

      expect(api.create.mock.calls[0][0].addresses).toEqual([
        { id: null, street: 'Bahnhofstrasse', number: '10', postalCode: '8001', city: 'Zürich' },
      ]);
    });

    it('rejects an address without city', async () => {
      await expect(
        run(tool(CreatePersonTool), {
          firstName: 'Lisa',
          lastName: 'Meier',
          addresses: [{ street: 'Weg' }],
        }),
      ).rejects.toThrow("Argument 'city' is required.");
    });

    it('rejects missing names before calling the backend', async () => {
      await expect(run(tool(CreatePersonTool), { firstName: 'Lisa' })).rejects.toThrow(
        "Argument 'lastName' is required.",
      );
      expect(api.create).not.toHaveBeenCalled();
    });

    it('is a write tool', () => {
      expect(tool(CreatePersonTool).permission).toBe('write');
    });
  });

  describe('update_person', () => {
    it('changes only the given fields and keeps the addresses', async () => {
      await run(tool(UpdatePersonTool), { id: 'p1', phone: '+41 61 000 00 00', email: null });

      expect(api.update).toHaveBeenCalledWith(ANNA, {
        firstName: 'Anna',
        lastName: 'Muster',
        birthday: '1990-01-01',
        gender: 'Female',
        description: 'Beraterin',
        email: null,
        phone: '+41 61 000 00 00',
        type: 'Employee',
        addresses: [{ id: 'a1', street: 'Weg', number: '3', city: 'Basel', postalCode: '4000' }],
      });
      expect(changes.revision()).toBe(1);
    });

    it('refuses to clear a name', async () => {
      await expect(run(tool(UpdatePersonTool), { id: 'p1', lastName: '' })).rejects.toThrow(
        "Argument 'lastName' is required.",
      );
    });

    it('passes backend failures on and announces nothing', async () => {
      await expect(
        run(tool(UpdatePersonTool), { id: 'missing', phone: '1' }),
      ).rejects.toBeInstanceOf(HttpErrorResponse);
      expect(changes.revision()).toBe(0);
    });
  });

  describe('delete_person', () => {
    it('deletes by id and names the deleted person', async () => {
      const result = await run(tool(DeletePersonTool), { id: 'p2' });

      expect(api.delete).toHaveBeenCalledWith('p2');
      expect(result).toEqual({ deleted: 'Peter Keller' });
      expect(changes.revision()).toBe(1);
    });

    it('is a delete tool', () => {
      expect(tool(DeletePersonTool).permission).toBe('delete');
    });
  });

  describe('add_address', () => {
    it('appends a new address to the person', async () => {
      await run(tool(AddAddressTool), {
        personId: 'p1',
        street: 'Bahnhofstrasse',
        number: '10',
        postalCode: '8001',
        city: 'Zürich',
      });

      const draft = api.update.mock.calls[0][1];
      expect(draft.addresses).toEqual([
        { id: 'a1', street: 'Weg', number: '3', city: 'Basel', postalCode: '4000' },
        { id: null, street: 'Bahnhofstrasse', number: '10', postalCode: '8001', city: 'Zürich' },
      ]);
      expect(changes.revision()).toBe(1);
    });

    it('is a write tool', () => {
      expect(tool(AddAddressTool).permission).toBe('write');
    });
  });

  describe('remove_address', () => {
    it('removes the address from the person', async () => {
      await run(tool(RemoveAddressTool), { personId: 'p1', addressId: 'a1' });

      expect(api.update.mock.calls[0][1].addresses).toEqual([]);
    });

    it('fails for an address the person does not have', async () => {
      await expect(
        run(tool(RemoveAddressTool), { personId: 'p1', addressId: 'other' }),
      ).rejects.toThrow("Person 'p1' has no address 'other'.");
      expect(api.update).not.toHaveBeenCalled();
    });

    it('is a write tool', () => {
      expect(tool(RemoveAddressTool).permission).toBe('write');
    });
  });
});
