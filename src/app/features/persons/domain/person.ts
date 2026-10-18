export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

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

export interface Person extends AuditInfo {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  /** ISO calendar date, `yyyy-MM-dd`. */
  readonly birthday: string;
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

export interface PersonDraft {
  readonly firstName: string;
  readonly lastName: string;
  /** ISO calendar date, `yyyy-MM-dd`. */
  readonly birthday: string;
  readonly addresses: readonly AddressDraft[];
}

export function toPersonDraft(person: Person): PersonDraft {
  return {
    firstName: person.firstName,
    lastName: person.lastName,
    birthday: person.birthday,
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
