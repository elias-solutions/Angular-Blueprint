import { registerLocaleData } from '@angular/common';
import localeDeCh from '@angular/common/locales/de-CH';
import localeEnGb from '@angular/common/locales/en-GB';
import { Translations, de } from './de';
import { en } from './en';

export const LANGUAGES = ['de', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'de';

export const TRANSLATIONS: Readonly<Record<Language, Translations>> = { de, en };

export interface LanguageFormat {
  readonly locale: string;
  readonly date: string;
  readonly dateTime: string;
}

export const LANGUAGE_FORMATS: Readonly<Record<Language, LanguageFormat>> = {
  de: { locale: 'de-CH', date: 'dd.MM.yyyy', dateTime: 'dd.MM.yyyy HH:mm' },
  en: { locale: 'en-GB', date: 'dd/MM/yyyy', dateTime: 'dd/MM/yyyy HH:mm' },
};

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}

export function registerLanguageLocales(): void {
  registerLocaleData(localeDeCh);
  registerLocaleData(localeEnGb);
}
