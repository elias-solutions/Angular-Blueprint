import { Injectable, Provider } from '@angular/core';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MAT_NATIVE_DATE_FORMATS,
  MatDateFormats,
  NativeDateAdapter,
} from '@angular/material/core';

const SWISS_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/** Native adapter that reads and writes dates as `dd.MM.yyyy`. */
@Injectable()
export class SwissDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat: unknown): Date | null {
    if (typeof value !== 'string') {
      return super.parse(value, parseFormat);
    }
    const text = value.trim();
    if (text === '') {
      return null;
    }
    const match = SWISS_DATE.exec(text);
    if (!match) {
      return this.invalid();
    }
    const [day, month, year] = match.slice(1).map(Number);
    const date = new Date(year, month - 1, day);
    return date.getMonth() === month - 1 ? date : this.invalid();
  }

  override format(date: Date, displayFormat: object | null): string {
    if (displayFormat) {
      return super.format(date, displayFormat);
    }
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
  }
}

/** A `null` input format makes the adapter render its own `dd.MM.yyyy` instead of `Intl`'s output. */
const SWISS_DATE_FORMATS: MatDateFormats = {
  ...MAT_NATIVE_DATE_FORMATS,
  display: { ...MAT_NATIVE_DATE_FORMATS.display, dateInput: null },
};

/** Everything Material's date components need to work with Swiss `dd.MM.yyyy` dates. */
export function provideSwissDates(): Provider[] {
  return [
    { provide: MAT_DATE_LOCALE, useValue: 'de-CH' },
    { provide: DateAdapter, useClass: SwissDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: SWISS_DATE_FORMATS },
  ];
}
