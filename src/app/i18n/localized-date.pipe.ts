import { formatDate } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageFormat } from './language';
import { LanguageService } from './language.service';

export type DateDisplay = 'date' | 'dateTime';

export function formatIsoDate(
  value: string,
  format: LanguageFormat,
  display: DateDisplay = 'date',
): string {
  return formatDate(value, display === 'date' ? format.date : format.dateTime, format.locale);
}

/** Formats ISO dates in the active language's pattern; impure so it follows language switches. */
@Pipe({ name: 'localDate', pure: false })
export class LocalizedDatePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(value: string | null | undefined, display: DateDisplay = 'date'): string {
    return value ? formatIsoDate(value, this.language.format(), display) : '';
  }
}
