import { AddressDraft, PersonDraft } from './person';

export function withAddressAdded(draft: PersonDraft, address: AddressDraft): PersonDraft {
  return { ...draft, addresses: [...draft.addresses, address] };
}

export function withAddressReplaced(
  draft: PersonDraft,
  addressId: string,
  address: AddressDraft,
): PersonDraft {
  return {
    ...draft,
    addresses: draft.addresses.map((existing) =>
      existing.id === addressId ? { ...address, id: addressId } : existing,
    ),
  };
}

export function withAddressRemoved(draft: PersonDraft, addressId: string): PersonDraft {
  return { ...draft, addresses: draft.addresses.filter((existing) => existing.id !== addressId) };
}
