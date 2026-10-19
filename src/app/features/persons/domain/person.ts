export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

export const GENDERS = ['Male', 'Female'] as const;
export type Gender = (typeof GENDERS)[number];

export const PERSON_TYPES = ['Freelancer', 'Employee'] as const;
export type PersonType = (typeof PERSON_TYPES)[number];

export interface AuditInfo {
  readonly createdId: string;
  readonly createdDate: string;
  readonly modifiedId: string | null;
  readonly modifiedDate: string | null;
  readonly version: string;
}

export interface Address extends AuditInfo {
  readonly id: string;
  readonly street: string;
  readonly number: string;
  readonly city: string;
  readonly postalCode: string;
}

/** The person's own data, without identity, audit and addresses. */
export interface PersonProfile {
  readonly firstName: string;
  readonly lastName: string;
  /** ISO calendar date, `yyyy-MM-dd`. */
  readonly birthday: string | null;
  readonly gender: Gender | null;
  readonly description: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly type: PersonType | null;
}

export interface Person extends AuditInfo, PersonProfile {
  readonly id: string;
  readonly addresses: readonly Address[];
}

export interface AddressDraft {
  /** `null` for an address that does not exist in the backend yet. */
  readonly id: string | null;
  readonly street: string;
  readonly number: string;
  readonly city: string;
  readonly postalCode: string;
}

export interface PersonDraft extends PersonProfile {
  readonly addresses: readonly AddressDraft[];
}

export function toPersonProfile(source: PersonProfile): PersonProfile {
  return {
    firstName: source.firstName,
    lastName: source.lastName,
    birthday: source.birthday,
    gender: source.gender,
    description: source.description,
    email: source.email,
    phone: source.phone,
    type: source.type,
  };
}

export function toPersonDraft(person: Person): PersonDraft {
  return {
    ...toPersonProfile(person),
    addresses: person.addresses.map(toAddressDraft),
  };
}

export function toAddressDraft(address: Address): AddressDraft {
  return {
    id: address.id,
    street: address.street,
    number: address.number,
    city: address.city,
    postalCode: address.postalCode,
  };
}

export function fullName(person: Pick<Person, 'firstName' | 'lastName'>): string {
  return `${person.firstName} ${person.lastName}`;
}

/** Single-line postal form, e.g. `Hauptstrasse 1, 4600 Olten`. */
export function addressLine(address: Omit<AddressDraft, 'id'>): string {
  return `${address.street} ${address.number}, ${address.postalCode} ${address.city}`;
}
