import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { BlueprintPersonApiFactory } from './blueprint-person-api';
import { PERSON_API_FACTORIES } from './person-api';

export function providePersonApis(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: PERSON_API_FACTORIES,
      useFactory: () => [inject(BlueprintPersonApiFactory)],
    },
  ]);
}
