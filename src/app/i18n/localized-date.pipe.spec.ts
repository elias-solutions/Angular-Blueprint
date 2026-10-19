import { TestBed } from '@angular/core/testing';
import { provideLocalizedDates } from '../shared/date/localized-date-adapter';
import { LanguageService } from './language.service';
import { LocalizedDatePipe } from './localized-date.pipe';
import { translocoTesting } from './testing/transloco-testing';

describe('LocalizedDatePipe', () => {
  let pipe: LocalizedDatePipe;
  let language: LanguageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [translocoTesting()],
      providers: [provideLocalizedDates(), LocalizedDatePipe],
    });
    pipe = TestBed.inject(LocalizedDatePipe);
    language = TestBed.inject(LanguageService);
  });

  it('formats dates in the active language', () => {
    expect(pipe.transform('1985-04-02')).toBe('02.04.1985');

    language.select('en');

    expect(pipe.transform('1985-04-02')).toBe('02/04/1985');
  });

  it('formats date and time', () => {
    expect(pipe.transform('2026-05-01T13:45:00', 'dateTime')).toBe('01.05.2026 13:45');
  });

  it('renders nothing for a missing value', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
