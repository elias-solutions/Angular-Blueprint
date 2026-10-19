import { Person, fullName } from '../../domain/person';
import { PERSON_TYPE_LABELS } from '../person-labels';

/** Expects an already lower-cased filter, as `MatTableDataSource` provides it. */
export function personMatchesFilter(person: Person, filter: string): boolean {
  const searchable = [
    fullName(person),
    person.birthday ? swissDate(person.birthday) : null,
    person.email,
    person.phone,
    person.type ? PERSON_TYPE_LABELS[person.type] : null,
    ...person.addresses.flatMap((a) => [`${a.street} ${a.number}`, a.postalCode, a.city]),
  ];
  return searchable.some((value) => value?.toLowerCase().includes(filter) ?? false);
}

export function lastChange(person: Person): string {
  return person.modifiedDate ?? person.createdDate;
}

function swissDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

const SORT_VALUES: Readonly<Record<string, (person: Person) => string>> = {
  firstName: (person) => person.firstName.toLowerCase(),
  lastName: (person) => person.lastName.toLowerCase(),
  birthday: (person) => person.birthday ?? '',
  type: (person) => (person.type ? PERSON_TYPE_LABELS[person.type].toLowerCase() : ''),
  changed: lastChange,
};

export function personSortValue(person: Person, column: string): string {
  const sortValue = SORT_VALUES[column];
  if (!sortValue) {
    throw new Error(`Column '${column}' is not sortable.`);
  }
  return sortValue(person);
}
