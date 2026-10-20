import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  AddressDraft,
  GENDERS,
  PERSON_TYPES,
  Person,
  PersonProfile,
  addressLine,
  fullName,
  toPersonDraft,
  toPersonProfile,
} from '../../persons/domain/person';
import { withAddressAdded, withAddressRemoved } from '../../persons/domain/person-addresses';
import { PersonApi } from '../../persons/data/person-api';
import { PersonApiResolver } from '../../persons/data/person-api-resolver';
import { PersonChanges } from '../../persons/state/person-changes';
import { JsonSchema, ToolDefinition } from '../domain/chat';
import { ChatTool, ToolPermission } from './chat-tool';
import { ToolArgumentError, ToolArguments } from './tool-arguments';

const MAX_SEARCH_RESULTS = 25;

const text = (description: string): JsonSchema => ({ type: 'string', description });

const PROFILE_PROPERTIES: Readonly<Record<keyof PersonProfile, JsonSchema>> = {
  firstName: text('First name.'),
  lastName: text('Last name.'),
  birthday: text('Date of birth, format yyyy-MM-dd.'),
  gender: { type: 'string', enum: GENDERS, description: 'Gender.' },
  description: text('Free text, e.g. role or notes.'),
  email: text('Email address.'),
  phone: text('Phone number.'),
  type: { type: 'string', enum: PERSON_TYPES, description: 'Employment type.' },
};

const ADDRESS_PROPERTIES: Readonly<Record<string, JsonSchema>> = {
  street: text('Street name without house number.'),
  number: text('House number.'),
  postalCode: text('Postal code.'),
  city: text('City.'),
};

@Injectable({ providedIn: 'root' })
class PersonToolContext {
  private readonly resolver = inject(PersonApiResolver);
  private readonly changes = inject(PersonChanges);

  api(): PersonApi {
    return this.resolver.api();
  }

  load(id: string): Promise<Person> {
    return firstValueFrom(this.api().getById(id));
  }

  changed(): void {
    this.changes.notify();
  }
}

abstract class PersonTool implements ChatTool {
  protected readonly context = inject(PersonToolContext);
  abstract readonly permission: ToolPermission;
  abstract readonly definition: ToolDefinition;
  abstract execute(args: ToolArguments): Promise<unknown>;
}

@Injectable({ providedIn: 'root' })
export class SearchPersonsTool extends PersonTool {
  readonly permission = 'read';
  readonly definition: ToolDefinition = {
    name: 'search_persons',
    description:
      'Lists persons. Optional query matches name, email, phone, type and address. ' +
      `Returns at most ${MAX_SEARCH_RESULTS} persons with their id.`,
    parameters: {
      type: 'object',
      properties: { query: text('Search text; omit to list everyone.') },
    },
  };

  async execute(args: ToolArguments): Promise<unknown> {
    const query = args.optionalString('query')?.toLowerCase() ?? null;
    const persons = await firstValueFrom(this.context.api().getAll());
    const matches = persons.filter((person) => !query || searchText(person).includes(query));
    return {
      count: matches.length,
      persons: matches.slice(0, MAX_SEARCH_RESULTS).map(toSummary),
    };
  }
}

@Injectable({ providedIn: 'root' })
export class GetPersonTool extends PersonTool {
  readonly permission = 'read';
  readonly definition: ToolDefinition = {
    name: 'get_person',
    description: 'Returns all details of one person including addresses (with address ids).',
    parameters: {
      type: 'object',
      properties: { id: text('Person id from search_persons.') },
      required: ['id'],
    },
  };

  async execute(args: ToolArguments): Promise<unknown> {
    return toDetails(await this.context.load(args.requiredString('id')));
  }
}

@Injectable({ providedIn: 'root' })
export class CreatePersonTool extends PersonTool {
  readonly permission = 'write';
  readonly definition: ToolDefinition = {
    name: 'create_person',
    description: 'Creates a new person, optionally together with addresses.',
    parameters: {
      type: 'object',
      properties: {
        ...PROFILE_PROPERTIES,
        addresses: {
          type: 'array',
          description: 'Addresses of the new person.',
          items: { type: 'object', properties: ADDRESS_PROPERTIES, required: ['street', 'city'] },
        },
      },
      required: ['firstName', 'lastName'],
    },
  };

  async execute(args: ToolArguments): Promise<unknown> {
    const profile = readProfile(args, null);
    const addresses = args.optionalObjects('addresses').map(readAddress);
    const id = await firstValueFrom(this.context.api().create({ ...profile, addresses }));
    this.context.changed();
    return { created: fullName(profile), id };
  }
}

@Injectable({ providedIn: 'root' })
export class UpdatePersonTool extends PersonTool {
  readonly permission = 'write';
  readonly definition: ToolDefinition = {
    name: 'update_person',
    description:
      'Changes fields of an existing person. Only the given fields change; ' +
      'pass null to clear an optional field.',
    parameters: {
      type: 'object',
      properties: { id: text('Person id.'), ...PROFILE_PROPERTIES },
      required: ['id'],
    },
  };

  async execute(args: ToolArguments): Promise<unknown> {
    const person = await this.context.load(args.requiredString('id'));
    const profile = readProfile(args, person);
    await firstValueFrom(
      this.context.api().update(person, { ...toPersonDraft(person), ...profile }),
    );
    this.context.changed();
    return { updated: fullName(profile) };
  }
}

@Injectable({ providedIn: 'root' })
export class DeletePersonTool extends PersonTool {
  readonly permission = 'delete';
  readonly definition: ToolDefinition = {
    name: 'delete_person',
    description: 'Permanently deletes a person including all addresses.',
    parameters: {
      type: 'object',
      properties: { id: text('Person id.') },
      required: ['id'],
    },
  };

  async execute(args: ToolArguments): Promise<unknown> {
    const person = await this.context.load(args.requiredString('id'));
    await firstValueFrom(this.context.api().delete(person.id));
    this.context.changed();
    return { deleted: fullName(person) };
  }
}

@Injectable({ providedIn: 'root' })
export class AddAddressTool extends PersonTool {
  readonly permission = 'write';
  readonly definition: ToolDefinition = {
    name: 'add_address',
    description: 'Adds an address to an existing person.',
    parameters: {
      type: 'object',
      properties: { personId: text('Person id.'), ...ADDRESS_PROPERTIES },
      required: ['personId', 'street', 'city'],
    },
  };

  async execute(args: ToolArguments): Promise<unknown> {
    const person = await this.context.load(args.requiredString('personId'));
    const address = readAddress(args);
    await firstValueFrom(
      this.context.api().update(person, withAddressAdded(toPersonDraft(person), address)),
    );
    this.context.changed();
    return { added: addressLine(address), to: fullName(person) };
  }
}

@Injectable({ providedIn: 'root' })
export class RemoveAddressTool extends PersonTool {
  readonly permission = 'write';
  readonly definition: ToolDefinition = {
    name: 'remove_address',
    description: 'Removes one address from a person. Get the address id with get_person.',
    parameters: {
      type: 'object',
      properties: { personId: text('Person id.'), addressId: text('Address id.') },
      required: ['personId', 'addressId'],
    },
  };

  async execute(args: ToolArguments): Promise<unknown> {
    const person = await this.context.load(args.requiredString('personId'));
    const addressId = args.requiredString('addressId');
    const address = person.addresses.find((candidate) => candidate.id === addressId);
    if (!address) {
      throw new ToolArgumentError(`Person '${person.id}' has no address '${addressId}'.`);
    }
    await firstValueFrom(
      this.context.api().update(person, withAddressRemoved(toPersonDraft(person), addressId)),
    );
    this.context.changed();
    return { removed: addressLine(address), from: fullName(person) };
  }
}

function readProfile(args: ToolArguments, current: PersonProfile | null): PersonProfile {
  const base = current ? toPersonProfile(current) : null;
  const pick = <T>(name: keyof PersonProfile, read: () => T, fallback: T): T =>
    !base || args.has(name) ? read() : fallback;
  return {
    firstName: pick('firstName', () => args.requiredString('firstName'), base?.firstName ?? ''),
    lastName: pick('lastName', () => args.requiredString('lastName'), base?.lastName ?? ''),
    birthday: pick('birthday', () => args.optionalDate('birthday'), base?.birthday ?? null),
    gender: pick('gender', () => args.optionalEnum('gender', GENDERS), base?.gender ?? null),
    description: pick(
      'description',
      () => args.optionalString('description'),
      base?.description ?? null,
    ),
    email: pick('email', () => args.optionalString('email'), base?.email ?? null),
    phone: pick('phone', () => args.optionalString('phone'), base?.phone ?? null),
    type: pick('type', () => args.optionalEnum('type', PERSON_TYPES), base?.type ?? null),
  };
}

function readAddress(args: ToolArguments): AddressDraft {
  return {
    id: null,
    street: args.requiredString('street'),
    number: args.optionalString('number') ?? '',
    postalCode: args.optionalString('postalCode') ?? '',
    city: args.requiredString('city'),
  };
}

function searchText(person: Person): string {
  return [
    fullName(person),
    person.email,
    person.phone,
    person.type,
    ...person.addresses.map(addressLine),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function toSummary(person: Person) {
  return {
    id: person.id,
    name: fullName(person),
    birthday: person.birthday,
    type: person.type,
    email: person.email,
    phone: person.phone,
    cities: person.addresses.map((address) => address.city),
  };
}

function toDetails(person: Person) {
  return {
    id: person.id,
    ...toPersonProfile(person),
    addresses: person.addresses.map((address) => ({
      id: address.id,
      street: address.street,
      number: address.number,
      postalCode: address.postalCode,
      city: address.city,
    })),
  };
}
