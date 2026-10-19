import { ModuleWithProviders } from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { DEFAULT_LANGUAGE, LANGUAGES, Language, TRANSLATIONS } from '../language';

/** Real translations, preloaded, so specs can assert on rendered texts. */
export function translocoTesting(
  language: Language = DEFAULT_LANGUAGE,
): ModuleWithProviders<TranslocoTestingModule> {
  return TranslocoTestingModule.forRoot({
    langs: { ...TRANSLATIONS },
    translocoConfig: { availableLangs: [...LANGUAGES], defaultLang: language },
    preloadLangs: true,
  });
}
