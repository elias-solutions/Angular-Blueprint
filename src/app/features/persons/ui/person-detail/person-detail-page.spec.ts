import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LanguageService } from '../../../../i18n/language.service';
import { translocoTesting } from '../../../../i18n/testing/transloco-testing';
import { provideLocalizedDates } from '../../../../shared/date/localized-date-adapter';
import { Person } from '../../domain/person';
import { PersonsStore } from '../../state/persons-store';
import { PersonDetailPage } from './person-detail-page';

const PERSON: Person = {
  id: '6f1c2a9e-0000-4000-8000-000000000001',
  firstName: 'Jonas',
  lastName: 'Elias',
  birthday: '1985-04-12',
  gender: 'Male',
  description: null,
  email: 'jonas.elias@example.com',
  phone: null,
  type: 'Employee',
  addresses: [
    {
      id: '6f1c2a9e-0000-4000-8000-0000000000a1',
      street: 'Hauptstrasse',
      number: '1',
      city: 'Olten',
      postalCode: '4600',
      createdId: 'u',
      createdDate: '2026-01-01T00:00:00Z',
      modifiedId: null,
      modifiedDate: null,
      version: '6f1c2a9e-0000-4000-8000-0000000000b1',
    },
  ],
  createdId: 'u',
  createdDate: '2026-01-01T00:00:00Z',
  modifiedId: null,
  modifiedDate: null,
  version: '6f1c2a9e-0000-4000-8000-0000000000c1',
};

describe('PersonDetailPage', () => {
  beforeEach(() => {
    const api = signal({ capabilities: { write: true } });
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [translocoTesting()],
      providers: [
        provideRouter([]),
        provideLocalizedDates(),
        {
          provide: PersonsStore,
          useValue: {
            selected: signal(PERSON),
            loading: signal(false),
            activeApi: api,
            canWrite: computed(() => api().capabilities.write),
            canDelete: computed(() => api().capabilities.write),
            readOnlyHint: signal('common.readOnlyHint'),
            deleteHint: signal('common.readOnlyHint'),
            loadPerson: () => Promise.resolve(),
          },
        },
      ],
    });
  });

  it('never shows technical ids or versions', () => {
    const fixture = TestBed.createComponent(PersonDetailPage);
    fixture.componentRef.setInput('id', PERSON.id);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Jonas Elias');
    expect(text).not.toMatch(/\bID\b|Version/);
    expect(text).not.toContain(PERSON.id);
    expect(text).not.toContain(PERSON.version);
    expect(text).not.toContain(PERSON.addresses[0].id);
    expect(text).not.toContain(PERSON.addresses[0].version);
  });

  it('renders labels and dates in the active language', async () => {
    TestBed.inject(LanguageService).select('en');
    const fixture = TestBed.createComponent(PersonDetailPage);
    fixture.componentRef.setInput('id', PERSON.id);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Born on 12/04/1985');
    expect(text).toContain('Gender');
    expect(text).toContain('Employee');
    expect(text).toContain('Addresses');
  });
});
