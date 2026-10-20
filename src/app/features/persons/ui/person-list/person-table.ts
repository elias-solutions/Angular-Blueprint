import { Person, PersonType, fullName } from '../../domain/person';

export interface PersonTableText {
  typeLabel(type: PersonType): string;
  date(isoDate: string): string;
}

export function personMatchesFilter(
  person: Person,
  filter: string,
  text: PersonTableText,
): boolean {
  const searchable = [
    fullName(person),
    person.birthday ? text.date(person.birthday) : null,
    person.email,
    person.phone,
    person.type ? text.typeLabel(person.type) : null,
    ...person.addresses.flatMap((a) => [`${a.street} ${a.number}`, a.postalCode, a.city]),
  ];
  return searchable.some((value) => value?.toLowerCase().includes(filter) ?? false);
}

export function lastChange(person: Person): string {
  return person.modifiedDate ?? person.createdDate;
}

type SortValue = (person: Person, text: PersonTableText) => string;

const SORT_VALUES: Readonly<Record<string, SortValue>> = {
  firstName: (person) => person.firstName.toLowerCase(),
  lastName: (person) => person.lastName.toLowerCase(),
  birthday: (person) => person.birthday ?? '',
  type: (person, text) => (person.type ? text.typeLabel(person.type).toLowerCase() : ''),
  changed: lastChange,
};

export function personSortValue(person: Person, column: string, text: PersonTableText): string {
  const sortValue = SORT_VALUES[column];
  if (!sortValue) {
    throw new Error(`Column '${column}' is not sortable.`);
  }
  return sortValue(person, text);
}
