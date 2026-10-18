import { AddressDraft, PersonDraft } from './person';
import { withAddressAdded, withAddressRemoved, withAddressReplaced } from './person-addresses';

const home: AddressDraft = {
  id: 'a1',
  street: 'Weg',
  number: '1',
  city: 'Olten',
  postalCode: '4600',
};
const work: AddressDraft = {
  id: 'a2',
  street: 'Gasse',
  number: '2',
  city: 'Bern',
  postalCode: '3000',
};
const draft: PersonDraft = {
  firstName: 'Jonas',
  lastName: 'Elias',
  birthday: '1985-04-12',
  addresses: [home, work],
};

describe('person-addresses', () => {
  it('appends a new address', () => {
    const added = { ...home, id: null, street: 'Neu' };

    expect(withAddressAdded(draft, added).addresses).toEqual([home, work, added]);
  });

  it('replaces an address in place, keeping its id', () => {
    const changed = withAddressReplaced(draft, 'a1', { ...home, id: null, city: 'Aarau' });

    expect(changed.addresses).toEqual([{ ...home, city: 'Aarau' }, work]);
  });

  it('removes an address', () => {
    expect(withAddressRemoved(draft, 'a1').addresses).toEqual([work]);
  });

  it('does not mutate the original draft', () => {
    withAddressRemoved(draft, 'a1');

    expect(draft.addresses).toEqual([home, work]);
  });
});
