import { Person, fullName } from '../../domain/person';

/** Expects an already lower-cased filter, as `MatTableDataSource` provides it. */
export function personMatchesFilter(person: Person, filter: string): boolean {
  const [year, month, day] = person.birthday.split('-');
  const searchable = [
    fullName(person),
    `${day}.${month}.${year}`,
    ...person.addresses.flatMap((a) => [`${a.street} ${a.number}`, a.postalCode, a.city]),
  ];
  return searchable.some((value) => value.toLowerCase().includes(filter));
}

export function lastChange(person: Person): string {
  return person.modifiedDate ?? person.createdDate;
}

const SORT_VALUES: Readonly<Record<string, (person: Person) => string | number>> = {
  firstName: (person) => person.firstName.toLowerCase(),
  lastName: (person) => person.lastName.toLowerCase(),
  birthday: (person) => person.birthday,
  addresses: (person) => person.addresses.length,
  changed: lastChange,
};

export function personSortValue(person: Person, column: string): string | number {
  const sortValue = SORT_VALUES[column];
  if (!sortValue) {
    throw new Error(`Column '${column}' is not sortable.`);
  }
  return sortValue(person);
}
