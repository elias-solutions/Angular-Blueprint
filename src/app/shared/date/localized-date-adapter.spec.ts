import { TestBed } from '@angular/core/testing';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { LocalizedDateAdapter } from './localized-date-adapter';

describe('LocalizedDateAdapter', () => {
  let adapter: LocalizedDateAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocalizedDateAdapter, { provide: MAT_DATE_LOCALE, useValue: 'de-CH' }],
    });
    adapter = TestBed.inject(LocalizedDateAdapter);
  });

  const parts = (date: Date) => [date.getFullYear(), date.getMonth(), date.getDate()];

  describe('de-CH', () => {
    it.each([
      ['12.04.1985', [1985, 3, 12]],
      ['1.2.2001', [2001, 1, 1]],
    ])('parses %s', (input, expected) => {
      expect(parts(adapter.parse(input, null)!)).toEqual(expected);
    });

    it.each(['31.02.2001', '12/04/1985', 'abc'])('rejects %s', (input) => {
      expect(adapter.isValid(adapter.parse(input, null) as Date)).toBe(false);
    });

    it('formats as dd.MM.yyyy', () => {
      expect(adapter.format(new Date(1985, 3, 2), null)).toBe('02.04.1985');
    });
  });

  describe('en-GB', () => {
    beforeEach(() => adapter.setLocale('en-GB'));

    it('parses dd/MM/yyyy', () => {
      expect(parts(adapter.parse('12/04/1985', null)!)).toEqual([1985, 3, 12]);
    });

    it.each(['12.04.1985', '31/02/2001'])('rejects %s', (input) => {
      expect(adapter.isValid(adapter.parse(input, null) as Date)).toBe(false);
    });

    it('formats as dd/MM/yyyy', () => {
      expect(adapter.format(new Date(1985, 3, 2), null)).toBe('02/04/1985');
    });
  });

  it('treats empty input as no date', () => {
    expect(adapter.parse('', null)).toBeNull();
  });
});
