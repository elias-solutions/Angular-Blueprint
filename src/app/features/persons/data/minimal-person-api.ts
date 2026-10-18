import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BackendConfig } from '../../../core/config/app-config';
import { Address, AddressDraft, EMPTY_GUID, Person, PersonDraft } from '../domain/person';
import { PersonApi, PersonApiFactory } from './person-api';

/**
 * Wire contract of the standalone NET-Blueprint.Minimal (`/persons`, `/addresses`).
 * Audit data is never sent; responses name it `createdBy`/`created`/`modifiedBy`/`modified`.
 */
interface MinimalAudit {
  createdBy: string;
  created: string;
  modifiedBy: string | null;
  modified: string | null;
  version: string;
}

interface MinimalAddressResponse extends MinimalAudit {
  id: string;
  street: string;
  number: string;
  city: string;
  postalCode: string;
}

interface MinimalPersonResponse extends MinimalAudit {
  id: string;
  firstName: string;
  lastName: string;
  birthday: string;
  addresses: MinimalAddressResponse[] | null;
}

interface MinimalAddressFields {
  street: string;
  number: string;
  city: string;
  postalCode: string;
}

interface MinimalCreatePersonRequest {
  firstName: string;
  lastName: string;
  birthday: string;
  addresses: MinimalAddressFields[];
}

interface MinimalUpdateAddressRequest extends MinimalAddressFields {
  addressId: string;
  version: string;
}

interface MinimalUpdatePersonRequest {
  id: string;
  firstName: string;
  lastName: string;
  birthday: string;
  addresses: MinimalUpdateAddressRequest[];
  version: string;
}

class MinimalPersonApi implements PersonApi {
  readonly capabilities = { write: true };
  private readonly personsUrl: string;

  constructor(
    private readonly http: HttpClient,
    backend: BackendConfig,
  ) {
    this.personsUrl = `${backend.baseUrl}/persons`;
  }

  getAll(): Observable<Person[]> {
    return this.http
      .get<MinimalPersonResponse[]>(this.personsUrl)
      .pipe(map((persons) => persons.map(toPerson)));
  }

  getById(id: string): Observable<Person> {
    return this.http.get<MinimalPersonResponse>(this.personUrl(id)).pipe(map(toPerson));
  }

  create(draft: PersonDraft): Observable<string> {
    const request: MinimalCreatePersonRequest = {
      firstName: draft.firstName,
      lastName: draft.lastName,
      birthday: draft.birthday,
      addresses: draft.addresses.map(toAddressFields),
    };
    return this.http
      .post<MinimalPersonResponse>(this.personsUrl, request)
      .pipe(map((person) => person.id));
  }

  update(original: Person, draft: PersonDraft): Observable<void> {
    const request: MinimalUpdatePersonRequest = {
      id: original.id,
      firstName: draft.firstName,
      lastName: draft.lastName,
      birthday: draft.birthday,
      version: original.version,
      addresses: draft.addresses.map((address) => toUpdateAddress(address, original.addresses)),
    };
    return this.http.put<void>(this.personUrl(original.id), request).pipe(map(() => undefined));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(this.personUrl(id)).pipe(map(() => undefined));
  }

  private personUrl(id: string): string {
    return `${this.personsUrl}/${encodeURIComponent(id)}`;
  }
}

function toAddressFields(address: AddressDraft): MinimalAddressFields {
  return {
    street: address.street,
    number: address.number,
    city: address.city,
    postalCode: address.postalCode,
  };
}

function toUpdateAddress(
  draft: AddressDraft,
  existing: readonly Address[],
): MinimalUpdateAddressRequest {
  const original = existing.find((address) => address.id === draft.id);
  return {
    addressId: original?.id ?? EMPTY_GUID,
    ...toAddressFields(draft),
    version: original?.version ?? EMPTY_GUID,
  };
}

function toAudit(dto: MinimalAudit) {
  return {
    createdId: dto.createdBy,
    createdDate: dto.created,
    modifiedId: dto.modifiedBy,
    modifiedDate: dto.modified,
    version: dto.version,
  };
}

function toAddress(dto: MinimalAddressResponse): Address {
  return {
    id: dto.id,
    street: dto.street,
    number: dto.number,
    city: dto.city,
    postalCode: dto.postalCode,
    ...toAudit(dto),
  };
}

function toPerson(dto: MinimalPersonResponse): Person {
  return {
    id: dto.id,
    firstName: dto.firstName,
    lastName: dto.lastName,
    birthday: dto.birthday,
    addresses: (dto.addresses ?? []).map(toAddress),
    ...toAudit(dto),
  };
}

@Injectable({ providedIn: 'root' })
export class MinimalPersonApiFactory implements PersonApiFactory {
  readonly kind = 'blueprint-minimal';
  private readonly http = inject(HttpClient);

  create(backend: BackendConfig): PersonApi {
    return new MinimalPersonApi(this.http, backend);
  }
}
