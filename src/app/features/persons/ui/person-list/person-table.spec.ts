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
  addresses: [
    { id: 'a1', street: 'Hauptstrasse', number: '1', city: 'Olten', postalCode: '4600', ...audit },
  ],
  ...audit,
};

describe('person-table', () => {
  it.each(['jonas', 'elias', 'jonas elias', 'olten', '4600', '12.04.1985'])(
    'matches filter %p',
    (filter) => {
      expect(personMatchesFilter(PERSON, filter)).toBe(true);
    },
  );

  it('does not match unrelated text', () => {
    expect(personMatchesFilter(PERSON, 'bern')).toBe(false);
  });

  it('sorts names case-insensitively', () => {
    expect(personSortValue(PERSON, 'lastName')).toBe('elias');
  });

  it('sorts by address count and last change', () => {
    expect(personSortValue(PERSON, 'addresses')).toBe(1);
    expect(personSortValue({ ...PERSON, modifiedDate: '2026-05-01T00:00:00Z' }, 'changed')).toBe(
      '2026-05-01T00:00:00Z',
    );
    expect(personSortValue(PERSON, 'changed')).toBe('2026-01-01T00:00:00Z');
  });
});
