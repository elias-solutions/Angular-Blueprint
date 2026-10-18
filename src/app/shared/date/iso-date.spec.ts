import { parseIsoDate, toIsoDate } from './iso-date';

describe('iso-date', () => {
  it('formats a local date as yyyy-MM-dd', () => {
    expect(toIsoDate(new Date(1985, 3, 2))).toBe('1985-04-02');
  });

  it('parses yyyy-MM-dd as a local date', () => {
    const date = parseIsoDate('1985-04-02');

    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([1985, 3, 2]);
  });

  it('rejects malformed values', () => {
    expect(() => parseIsoDate('02.04.1985')).toThrow("Invalid ISO date '02.04.1985'.");
  });
});
