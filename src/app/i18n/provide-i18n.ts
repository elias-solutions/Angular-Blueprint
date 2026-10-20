import {
  EnvironmentProviders,
  Injector,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService, provideTransloco } from '@jsverse/transloco';
import { firstValueFrom, forkJoin } from 'rxjs';
import { provideLocalizedDates } from '../shared/date/localized-date-adapter';
import { DEFAULT_LANGUAGE, LANGUAGES } from './language';
import { LanguageService } from './language.service';
import { StaticTranslocoLoader } from './static-transloco-loader';
import { TranslatedPaginatorIntl } from './translated-paginator-intl';

export function provideI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: [...LANGUAGES],
        defaultLang: DEFAULT_LANGUAGE,
        fallbackLang: DEFAULT_LANGUAGE,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: StaticTranslocoLoader,
    }),
    provideLocalizedDates(),
    { provide: MatPaginatorIntl, useClass: TranslatedPaginatorIntl },
    provideAppInitializer(() => {
      const transloco = inject(TranslocoService);
      const injector = inject(Injector);
      return firstValueFrom(forkJoin(LANGUAGES.map((language) => transloco.load(language)))).then(
        () => void injector.get(LanguageService),
      );
    }),
  ]);
}
