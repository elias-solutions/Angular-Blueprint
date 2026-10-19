import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { DateAdapter } from '@angular/material/core';
import { TranslocoService } from '@jsverse/transloco';
import { provideLocalizedDates } from '../shared/date/localized-date-adapter';
import { LANGUAGE_STORAGE_KEY, LanguageService } from './language.service';
import { translocoTesting } from './testing/transloco-testing';

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [translocoTesting()],
      providers: [provideLocalizedDates()],
    });
  });

  it('starts in German with Swiss dates', () => {
    const language = TestBed.inject(LanguageService);

    expect(language.active()).toBe('de');
    expect(language.format().date).toBe('dd.MM.yyyy');
    expect(TestBed.inject(TranslocoService).getActiveLang()).toBe('de');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('de');
  });

  it('switches texts, date locale and document language, and remembers the choice', () => {
    const language = TestBed.inject(LanguageService);
    const dateAdapter = TestBed.inject(DateAdapter);

    language.select('en');

    expect(language.active()).toBe('en');
    expect(TestBed.inject(TranslocoService).translate('app.title')).toBe('Person management');
    expect(dateAdapter.format(new Date(1985, 3, 2), null)).toBe('02/04/1985');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('en');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });

  it('restores a remembered language', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

    expect(TestBed.inject(LanguageService).active()).toBe('en');
  });

  it('ignores an unknown remembered language', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');

    expect(TestBed.inject(LanguageService).active()).toBe('de');
  });
});
