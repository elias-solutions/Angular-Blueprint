import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { includeBearerTokenInterceptor } from 'keycloak-angular';

import { routes } from './app.routes';
import { provideAuth } from './core/auth/provide-auth';
import { AppConfig } from './core/config/app-config';
import { AppConfigStore } from './core/config/app-config-store';
import { provideChat } from './features/chat/provide-chat';
import { providePersonApis } from './features/persons/data/person-api.providers';
import { provideI18n } from './i18n/provide-i18n';

export function createAppConfig(config: AppConfig): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter(routes, withComponentInputBinding()),
      provideHttpClient(withFetch(), withInterceptors([includeBearerTokenInterceptor])),
      provideAppInitializer(() => inject(AppConfigStore).use(config)),
      provideAuth(config.auth),
      providePersonApis(),
      provideChat(),
      provideI18n(),
      { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
    ],
  };
}
