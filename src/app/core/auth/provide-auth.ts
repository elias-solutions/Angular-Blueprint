import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import {
  AutoRefreshTokenService,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  IncludeBearerTokenCondition,
  UserActivityService,
  createInterceptorCondition,
  provideKeycloak,
  withAutoRefreshToken,
} from 'keycloak-angular';
import { AuthConfig } from '../config/app-config';

const BACKEND_URL = /^\/backend\//;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export function provideAuth(config: AuthConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideKeycloak({
      config,
      initOptions: {
        onLoad: 'login-required',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      },
      features: [
        withAutoRefreshToken({ onInactivityTimeout: 'logout', sessionTimeout: SESSION_TIMEOUT_MS }),
      ],
      providers: [AutoRefreshTokenService, UserActivityService],
    }),
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [
        createInterceptorCondition<IncludeBearerTokenCondition>({ urlPattern: BACKEND_URL }),
      ],
    },
  ]);
}
