import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { BlueprintPersonApiFactory } from './blueprint-person-api';
import { MinimalPersonApiFactory } from './minimal-person-api';
import { PERSON_API_FACTORIES } from './person-api';

/** Registers one `PersonApi` strategy per backend kind; add new backend contracts here. */
export function providePersonApis(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: PERSON_API_FACTORIES,
      useFactory: () => [inject(BlueprintPersonApiFactory), inject(MinimalPersonApiFactory)],
    },
  ]);
}
