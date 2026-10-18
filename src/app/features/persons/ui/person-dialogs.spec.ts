import { TestBed } from '@angular/core/testing';
import { provideSwissDates } from '../../../shared/date/swiss-date-adapter';
import { PersonDialogs } from './person-dialogs';

describe('PersonDialogs', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideSwissDates()] });
  });

  afterEach(() => document.querySelector('.cdk-overlay-container')?.remove());

  it('opens the person form for a new person', () => {
    void TestBed.inject(PersonDialogs).editPerson();
    TestBed.tick();

    const dialog = document.querySelector('app-person-dialog');
    expect(dialog?.querySelector('h2')?.textContent).toContain('Neue Person');
    expect(dialog?.querySelectorAll('input')).toHaveLength(3);
  });

  it('shows an existing birthday as dd.MM.yyyy', () => {
    const person = {
      id: 'p1',
      firstName: 'Jonas',
      lastName: 'Elias',
      birthday: '1985-04-02',
      addresses: [],
      createdId: 'u',
      createdDate: '2026-01-01T00:00:00Z',
      modifiedId: null,
      modifiedDate: null,
      version: 'v',
    };

    void TestBed.inject(PersonDialogs).editPerson(person);
    TestBed.tick();

    const inputs = document.querySelectorAll<HTMLInputElement>('app-person-dialog input');
    expect(inputs[2].value).toBe('02.04.1985');
  });
});
