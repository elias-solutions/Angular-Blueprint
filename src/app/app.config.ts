import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import localeDeCh from '@angular/common/locales/de-CH';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { AppConfigStore } from './core/config/app-config-store';
import { providePersonApis } from './features/persons/data/person-api.providers';
import { provideSwissDates } from './shared/date/swiss-date-adapter';

registerLocaleData(localeDeCh);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideAppInitializer(() => inject(AppConfigStore).load()),
    providePersonApis(),
    { provide: LOCALE_ID, useValue: 'de-CH' },
    provideSwissDates(),
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
  ],
};
