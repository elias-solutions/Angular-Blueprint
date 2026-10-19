import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuditContext } from '../../../core/audit/audit-context';
import { BackendConfig } from '../../../core/config/app-config';
import {
  Address,
  AddressDraft,
  EMPTY_GUID,
  Person,
  PersonDraft,
  toPersonProfile,
} from '../domain/person';
import {
  CreatePersonRequest,
  CreatePersonResponse,
  GetPersonResponse,
  UpdateAddressRequest,
  UpdatePersonRequest,
} from './blueprint-api.dto';
import { PersonApi, PersonApiFactory } from './person-api';

class BlueprintPersonApi implements PersonApi {
  readonly capabilities = { write: true };
  private readonly personsUrl: string;

  constructor(
    private readonly http: HttpClient,
    private readonly audit: AuditContext,
    backend: BackendConfig,
  ) {
    this.personsUrl = `${backend.baseUrl}/persons`;
  }

  getAll(): Observable<Person[]> {
    return this.http
      .get<GetPersonResponse[]>(this.personsUrl)
      .pipe(map((persons) => persons.map(toPerson)));
  }

  getById(id: string): Observable<Person> {
    return this.http.get<GetPersonResponse>(this.personUrl(id)).pipe(map(toPerson));
  }

  create(draft: PersonDraft): Observable<string> {
    const createdId = this.audit.userId();
    const createdDate = this.audit.now();
    const request: CreatePersonRequest = {
      ...toPersonProfile(draft),
      createdId,
      createdDate,
      addresses: draft.addresses.map((address) => ({
        street: address.street,
        number: address.number,
        city: address.city,
        postalCode: address.postalCode,
        createdId,
        createdDate,
      })),
    };
    return this.http
      .post<CreatePersonResponse>(this.personsUrl, request)
      .pipe(map((response) => response.id));
  }

  update(original: Person, draft: PersonDraft): Observable<void> {
    const modifiedId = this.audit.userId();
    const modifiedDate = this.audit.now();
    const request: UpdatePersonRequest = {
      id: original.id,
      ...toPersonProfile(draft),
      createdId: original.createdId,
      createdDate: original.createdDate,
      modifiedId,
      modifiedDate,
      version: original.version,
      addresses: draft.addresses.map((address) =>
        this.toUpdateAddress(address, original.addresses, modifiedId, modifiedDate),
      ),
    };
    return this.http.put<void>(this.personUrl(original.id), request).pipe(map(() => undefined));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(this.personUrl(id)).pipe(map(() => undefined));
  }

  private personUrl(id: string): string {
    return `${this.personsUrl}/${encodeURIComponent(id)}`;
  }

  private toUpdateAddress(
    draft: AddressDraft,
    existing: readonly Address[],
    modifiedId: string,
    modifiedDate: string,
  ): UpdateAddressRequest {
    const original = existing.find((address) => address.id === draft.id);
    return {
      addressId: original?.id ?? EMPTY_GUID,
      street: draft.street,
      number: draft.number,
      city: draft.city,
      postalCode: draft.postalCode,
      createdId: original?.createdId ?? modifiedId,
      createdDate: original?.createdDate ?? modifiedDate,
      modifiedId,
      modifiedDate,
      version: original?.version ?? EMPTY_GUID,
    };
  }
}

function toPerson(dto: GetPersonResponse): Person {
  return { ...dto, addresses: dto.addresses ?? [] };
}

@Injectable({ providedIn: 'root' })
export class BlueprintPersonApiFactory implements PersonApiFactory {
  readonly kind = 'blueprint-api';
  private readonly http = inject(HttpClient);
  private readonly audit = inject(AuditContext);

  create(backend: BackendConfig): PersonApi {
    return new BlueprintPersonApi(this.http, this.audit, backend);
  }
}
