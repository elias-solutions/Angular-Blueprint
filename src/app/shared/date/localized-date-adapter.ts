import { Injectable, Provider } from '@angular/core';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MAT_NATIVE_DATE_FORMATS,
  MatDateFormats,
  NativeDateAdapter,
} from '@angular/material/core';

const DAY_MONTH_YEAR = /^\d{1,2}-\d{1,2}-\d{4}$/;

/**
 * Native adapter that reads and writes numeric day-first dates (`dd.MM.yyyy`, `dd/MM/yyyy`, …)
 * with the separator of the current locale; switch it via `setLocale`.
 */
@Injectable()
export class LocalizedDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat: unknown): Date | null {
    if (typeof value !== 'string') {
      return super.parse(value, parseFormat);
    }
    const text = value.trim();
    if (text === '') {
      return null;
    }
    const parts = text.split(this.separator());
    if (!DAY_MONTH_YEAR.test(parts.join('-'))) {
      return this.invalid();
    }
    const [day, month, year] = parts.map(Number);
    const date = new Date(year, month - 1, day);
    return date.getMonth() === month - 1 ? date : this.invalid();
  }

  override format(date: Date, displayFormat: object | null): string {
    if (displayFormat) {
      return super.format(date, displayFormat);
    }
    const pad = (value: number) => String(value).padStart(2, '0');
    const separator = this.separator();
    return [pad(date.getDate()), pad(date.getMonth() + 1), date.getFullYear()].join(separator);
  }

  private separator(): string {
    const literal = new Intl.DateTimeFormat(this.locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
      .formatToParts(new Date(2000, 0, 1))
      .find((part) => part.type === 'literal');
    return literal?.value.trim() || '.';
  }
}

/** A `null` input format makes the adapter render its own numeric date instead of `Intl`'s output. */
const LOCALIZED_DATE_FORMATS: MatDateFormats = {
  ...MAT_NATIVE_DATE_FORMATS,
  display: { ...MAT_NATIVE_DATE_FORMATS.display, dateInput: null },
};

/** Everything Material's date components need; starts Swiss, `LanguageService` switches the locale. */
export function provideLocalizedDates(): Provider[] {
  return [
    { provide: MAT_DATE_LOCALE, useValue: 'de-CH' },
    { provide: DateAdapter, useClass: LocalizedDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: LOCALIZED_DATE_FORMATS },
  ];
}
