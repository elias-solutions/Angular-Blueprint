import { Gender, PersonType } from '../domain/person';

export interface GetAddressResponse {
  id: string;
  street: string;
  number: string;
  city: string;
  postalCode: string;
  createdId: string;
  createdDate: string;
  modifiedId: string | null;
  modifiedDate: string | null;
  version: string;
}

export interface GetPersonResponse {
  id: string;
  firstName: string;
  lastName: string;
  birthday: string | null;
  gender: Gender | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  type: PersonType | null;
  addresses: GetAddressResponse[] | null;
  createdId: string;
  createdDate: string;
  modifiedId: string | null;
  modifiedDate: string | null;
  version: string;
}

export interface CreateAddressRequest {
  street: string;
  number: string;
  city: string;
  postalCode: string;
  createdId: string;
  createdDate: string;
}

export interface CreatePersonRequest {
  firstName: string;
  lastName: string;
  birthday: string | null;
  gender: Gender | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  type: PersonType | null;
  createdId: string;
  createdDate: string;
  addresses: CreateAddressRequest[];
}

export interface CreatePersonResponse {
  id: string;
}

export interface UpdateAddressRequest {
  addressId: string;
  street: string;
  number: string;
  city: string;
  postalCode: string;
  createdId: string;
  createdDate: string;
  modifiedId: string;
  modifiedDate: string;
  version: string;
}

export interface UpdatePersonRequest {
  id: string;
  firstName: string;
  lastName: string;
  birthday: string | null;
  gender: Gender | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  type: PersonType | null;
  addresses: UpdateAddressRequest[];
  createdId: string;
  createdDate: string;
  modifiedId: string;
  modifiedDate: string;
  version: string;
}
