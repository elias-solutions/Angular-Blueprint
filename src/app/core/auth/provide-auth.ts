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

/** Backend calls go through the dev-server proxy under `/backend/...`; only they get the token. */
const BACKEND_URL = /^\/backend\//;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Signs the user in before the app starts (authorization code flow with PKCE) and keeps the
 * access token fresh; register `includeBearerTokenInterceptor` on `HttpClient` as well.
 */
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
