import { TestBed } from '@angular/core/testing';
import { LanguageService } from '../../../i18n/language.service';
import { translocoTesting } from '../../../i18n/testing/transloco-testing';
import { provideLocalizedDates } from '../../../shared/date/localized-date-adapter';
import { DIALOG_PANEL_CLASS, DIALOG_WIDTH } from '../../../shared/dialog/app-dialog';
import { Person } from '../domain/person';
import { PersonDialogs } from './person-dialogs';

const PERSON: Person = {
  id: 'p1',
  firstName: 'Jonas',
  lastName: 'Elias',
  birthday: '1985-04-02',
  gender: 'Male',
  description: 'Senior Consultant',
  email: 'jonas.elias@example.com',
  phone: '+41 62 000 00 00',
  type: 'Employee',
  addresses: [],
  createdId: 'u',
  createdDate: '2026-01-01T00:00:00Z',
  modifiedId: null,
  modifiedDate: null,
  version: 'v',
};

describe('PersonDialogs', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [translocoTesting()],
      providers: [provideLocalizedDates()],
    });
    TestBed.inject(LanguageService);
  });

  afterEach(() => document.querySelector('.cdk-overlay-container')?.remove());

  it('opens person, address and confirm dialogs with the same width', () => {
    const dialogs = TestBed.inject(PersonDialogs);
    void dialogs.editPerson();
    void dialogs.editAddress();
    void dialogs.confirmDeletePerson(PERSON);
    TestBed.tick();

    const panes = Array.from(document.querySelectorAll<HTMLElement>('.cdk-overlay-pane'));
    expect(panes).toHaveLength(3);
    expect(panes.map((pane) => pane.style.width)).toEqual([
      DIALOG_WIDTH,
      DIALOG_WIDTH,
      DIALOG_WIDTH,
    ]);
    expect(panes.every((pane) => pane.classList.contains(DIALOG_PANEL_CLASS))).toBe(true);
  });

  it('asks before deleting a person, in the active language', () => {
    TestBed.inject(LanguageService).select('en');
    void TestBed.inject(PersonDialogs).confirmDeletePerson(PERSON);
    TestBed.tick();

    const dialog = document.querySelector('app-confirm-dialog');
    const buttons = Array.from(dialog?.querySelectorAll('button') ?? []).map((button) =>
      button.textContent?.trim(),
    );
    expect(dialog?.querySelector('h2')?.textContent).toContain('Delete person');
    expect(dialog?.textContent).toContain(
      'Permanently delete Jonas Elias including all addresses?',
    );
    expect(buttons).toEqual(['Cancel', 'Delete']);
  });

  it('names the address to delete', () => {
    const address = {
      id: 'a1',
      street: 'Hauptstrasse',
      number: '1',
      city: 'Olten',
      postalCode: '4600',
      createdId: 'u',
      createdDate: '2026-01-01T00:00:00Z',
      modifiedId: null,
      modifiedDate: null,
      version: 'v',
    };
    void TestBed.inject(PersonDialogs).confirmDeleteAddress(address);
    TestBed.tick();

    const dialog = document.querySelector('app-confirm-dialog');
    expect(dialog?.querySelector('h2')?.textContent).toContain('Adresse löschen');
    expect(dialog?.textContent).toContain('Hauptstrasse 1, 4600 Olten löschen?');
  });

  it('opens the person form for a new person', () => {
    void TestBed.inject(PersonDialogs).editPerson();
    TestBed.tick();

    const dialog = document.querySelector('app-person-dialog');
    expect(dialog?.querySelector('h2')?.textContent).toContain('Neue Person');
    expect(dialog?.querySelectorAll('input')).toHaveLength(5);
    expect(dialog?.querySelectorAll('textarea')).toHaveLength(1);
    expect(dialog?.querySelectorAll('mat-select')).toHaveLength(2);
  });

  it('lays out the person form in a grid where only the description spans both columns', () => {
    void TestBed.inject(PersonDialogs).editPerson();
    TestBed.tick();

    const grid = document.querySelector('app-person-dialog mat-dialog-content > .form-grid');
    const fields = Array.from(grid?.querySelectorAll(':scope > mat-form-field') ?? []);
    const fullWidth = fields.filter((field) => field.classList.contains('span-2'));
    expect(fields).toHaveLength(8);
    expect(fullWidth).toHaveLength(1);
    expect(fullWidth[0].querySelector('textarea')).not.toBeNull();
  });

  it('lays out the address form in a grid inside the dialog content', () => {
    void TestBed.inject(PersonDialogs).editAddress();
    TestBed.tick();

    const grid = document.querySelector('app-address-dialog mat-dialog-content > .form-grid');
    expect(grid?.querySelectorAll(':scope > mat-form-field')).toHaveLength(4);
  });

  it('gives street and city the wide cells, number and postal code the narrow ones', () => {
    void TestBed.inject(PersonDialogs).editAddress();
    TestBed.tick();

    const fields = Array.from(
      document.querySelectorAll('app-address-dialog .form-grid > mat-form-field'),
    );
    const labels = fields.map((field) => field.querySelector('mat-label')?.textContent?.trim());
    const wide = fields.map((field) => field.classList.contains('wide'));
    expect(labels).toEqual(['Strasse', 'Nr.', 'PLZ', 'Ort']);
    expect(wide).toEqual([true, false, false, true]);
  });

  it('shows an existing birthday as dd.MM.yyyy', () => {
    void TestBed.inject(PersonDialogs).editPerson(PERSON);
    TestBed.tick();

    const inputs = document.querySelectorAll<HTMLInputElement>('app-person-dialog input');
    expect(inputs[2].value).toBe('02.04.1985');
  });

  it('prefills the contact data and description of an existing person', () => {
    void TestBed.inject(PersonDialogs).editPerson(PERSON);
    TestBed.tick();

    const inputs = document.querySelectorAll<HTMLInputElement>('app-person-dialog input');
    const description = document.querySelector<HTMLTextAreaElement>('app-person-dialog textarea');
    expect(inputs[3].value).toBe('jonas.elias@example.com');
    expect(inputs[4].value).toBe('+41 62 000 00 00');
    expect(description?.value).toBe('Senior Consultant');
  });

  it('leaves the birthday empty for a person without one', () => {
    void TestBed.inject(PersonDialogs).editPerson({ ...PERSON, birthday: null });
    TestBed.tick();

    const inputs = document.querySelectorAll<HTMLInputElement>('app-person-dialog input');
    expect(inputs[2].value).toBe('');
  });

  it('shows the person form in English with English dates', () => {
    TestBed.inject(LanguageService).select('en');
    void TestBed.inject(PersonDialogs).editPerson(PERSON);
    TestBed.tick();

    const dialog = document.querySelector('app-person-dialog');
    const labels = Array.from(dialog?.querySelectorAll('mat-label') ?? []).map((label) =>
      label.textContent?.trim(),
    );
    const inputs = document.querySelectorAll<HTMLInputElement>('app-person-dialog input');
    expect(dialog?.querySelector('h2')?.textContent).toContain('Edit person');
    expect(labels).toEqual([
      'First name',
      'Last name',
      'Date of birth',
      'Gender',
      'Email',
      'Phone',
      'Type',
      'Description',
    ]);
    expect(inputs[2].value).toBe('02/04/1985');
  });

  it('shows the address form in English', () => {
    TestBed.inject(LanguageService).select('en');
    void TestBed.inject(PersonDialogs).editAddress();
    TestBed.tick();

    const labels = Array.from(document.querySelectorAll('app-address-dialog mat-label')).map(
      (label) => label.textContent?.trim(),
    );
    expect(labels).toEqual(['Street', 'No.', 'Postcode', 'City']);
  });
});
