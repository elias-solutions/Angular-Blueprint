import { Person } from '../../domain/person';
import { personMatchesFilter, personSortValue } from './person-table';

const audit = {
  createdId: 'u',
  createdDate: '2026-01-01T00:00:00Z',
  modifiedId: null,
  modifiedDate: null,
  version: 'v',
};

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
    { id: 'a1', street: 'Hauptstrasse', number: '1', city: 'Olten', postalCode: '4600', ...audit },
  ],
  ...audit,
};

describe('person-table', () => {
  it.each([
    'jonas',
    'elias',
    'jonas elias',
    'olten',
    '4600',
    '12.04.1985',
    'jonas.elias@example',
    '+41 62',
    'angestellt',
  ])('matches filter %p', (filter) => {
    expect(personMatchesFilter(PERSON, filter)).toBe(true);
  });

  it('matches a person without optional data', () => {
    const minimal: Person = {
      ...PERSON,
      birthday: null,
      gender: null,
      description: null,
      email: null,
      phone: null,
      type: null,
    };

    expect(personMatchesFilter(minimal, 'jonas')).toBe(true);
    expect(personMatchesFilter(minimal, 'angestellt')).toBe(false);
  });

  it('sorts persons without birthday before all others', () => {
    expect(personSortValue({ ...PERSON, birthday: null }, 'birthday')).toBe('');
    expect(personSortValue(PERSON, 'birthday')).toBe('1985-04-12');
  });

  it('does not match unrelated text', () => {
    expect(personMatchesFilter(PERSON, 'bern')).toBe(false);
  });

  it('sorts names case-insensitively', () => {
    expect(personSortValue(PERSON, 'lastName')).toBe('elias');
  });

  it('offers no sorting by address count', () => {
    expect(() => personSortValue(PERSON, 'addresses')).toThrow(
      "Column 'addresses' is not sortable.",
    );
  });

  it('sorts by last change', () => {
    expect(personSortValue({ ...PERSON, modifiedDate: '2026-05-01T00:00:00Z' }, 'changed')).toBe(
      '2026-05-01T00:00:00Z',
    );
    expect(personSortValue(PERSON, 'changed')).toBe('2026-01-01T00:00:00Z');
  });
});
