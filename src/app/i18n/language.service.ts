import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { TranslocoService } from '@jsverse/transloco';
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_FORMATS,
  Language,
  isLanguage,
  registerLanguageLocales,
} from './language';

export const LANGUAGE_STORAGE_KEY = 'angular-blueprint.language';

/** The UI language: drives texts, date formats and `<html lang>`; remembered per browser. */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly dateAdapter = inject(DateAdapter);
  private readonly document = inject(DOCUMENT);
  private readonly activeState = signal<Language>(readStoredLanguage() ?? DEFAULT_LANGUAGE);

  readonly languages = LANGUAGES;
  readonly active = this.activeState.asReadonly();
  readonly format = computed(() => LANGUAGE_FORMATS[this.active()]);

  constructor() {
    registerLanguageLocales();
    this.apply(this.activeState());
  }

  select(language: Language): void {
    this.activeState.set(language);
    writeStoredLanguage(language);
    this.apply(language);
  }

  private apply(language: Language): void {
    this.transloco.setActiveLang(language);
    this.dateAdapter.setLocale(LANGUAGE_FORMATS[language].locale);
    this.document.documentElement.lang = language;
  }
}

function readStoredLanguage(): Language | null {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage may be unavailable (private mode); the choice then only lasts for the session.
  }
}
