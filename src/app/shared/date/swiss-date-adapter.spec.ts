import { TestBed } from '@angular/core/testing';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { SwissDateAdapter } from './swiss-date-adapter';

describe('SwissDateAdapter', () => {
  let adapter: SwissDateAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SwissDateAdapter, { provide: MAT_DATE_LOCALE, useValue: 'de-CH' }],
    });
    adapter = TestBed.inject(SwissDateAdapter);
  });

  it.each([
    ['12.04.1985', [1985, 3, 12]],
    ['1.2.2001', [2001, 1, 1]],
  ])('parses %s', (input, [year, month, day]) => {
    const date = adapter.parse(input, null)!;

    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([year, month, day]);
  });

  it.each(['31.02.2001', '12/04/1985', 'abc'])('rejects %s', (input) => {
    expect(adapter.isValid(adapter.parse(input, null) as Date)).toBe(false);
  });

  it('treats empty input as no date', () => {
    expect(adapter.parse('', null)).toBeNull();
  });

  it('formats as dd.MM.yyyy', () => {
    expect(adapter.format(new Date(1985, 3, 2), null)).toBe('02.04.1985');
  });
});
