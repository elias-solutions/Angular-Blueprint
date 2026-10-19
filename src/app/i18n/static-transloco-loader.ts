import { Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import { TRANSLATIONS, isLanguage } from './language';

/** Serves the bundled translations; no HTTP, so they are available synchronously. */
@Injectable({ providedIn: 'root' })
export class StaticTranslocoLoader implements TranslocoLoader {
  getTranslation(language: string): Observable<Translation> {
    if (!isLanguage(language)) {
      throw new Error(`Unsupported language '${language}'.`);
    }
    return of(TRANSLATIONS[language]);
  }
}
