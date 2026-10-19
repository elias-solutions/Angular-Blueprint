import { TestBed } from '@angular/core/testing';
import { provideLocalizedDates } from '../shared/date/localized-date-adapter';
import { LanguageService } from '../i18n/language.service';
import { translocoTesting } from '../i18n/testing/transloco-testing';
import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [translocoTesting()],
      providers: [provideLocalizedDates()],
    });
  });

  it('offers German and English and switches the language on click', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcher);
    await fixture.whenStable();

    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    );
    expect(buttons.map((button) => button.textContent?.trim())).toEqual(['DE', 'EN']);

    buttons[1].click();
    await fixture.whenStable();

    expect(TestBed.inject(LanguageService).active()).toBe('en');
  });
});
