import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { translocoTesting } from '../../i18n/testing/transloco-testing';
import { ApiErrorMapper } from './api-error-mapper';

describe('ApiErrorMapper', () => {
  let mapper: ApiErrorMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [translocoTesting()] });
    mapper = TestBed.inject(ApiErrorMapper);
  });

  const httpError = (status: number, error: unknown = null) =>
    new HttpErrorResponse({ status, error, url: '/api/v1/persons' });

  it('reports an unreachable backend', () => {
    expect(mapper.toMessage(httpError(0))).toBe('Backend nicht erreichbar.');
  });

  it.each([429, 503])('reports rate limiting for status %s', (status) => {
    expect(mapper.toMessage(httpError(status))).toBe(
      'Zu viele Anfragen – bitte einen Moment warten.',
    );
  });

  it.each([
    [401, 'Sitzung abgelaufen – bitte neu anmelden.'],
    [403, 'Keine Berechtigung für diese Aktion.'],
  ])('explains authentication failures for status %s', (status, message) => {
    expect(mapper.toMessage(httpError(status))).toBe(message);
  });

  it('prefers the problem details detail over the title', () => {
    const error = httpError(400, {
      title: 'BadRequest - Entity version conflict',
      status: 400,
      detail: 'Entity has been updated through other user.',
    });

    expect(mapper.toMessage(error)).toBe('Entity has been updated through other user.');
  });

  it('lists validation errors from a validation problem', () => {
    const error = httpError(400, {
      title: 'One or more validation errors occurred.',
      status: 400,
      errors: {
        FirstName: ['The FirstName field is required.'],
        City: ['Required.', 'Too short.'],
      },
    });

    expect(mapper.toMessage(error)).toBe('The FirstName field is required. Required. Too short.');
  });

  it('falls back to the title when there is no detail', () => {
    expect(mapper.toMessage(httpError(400, { title: 'Id mismatch', status: 400 }))).toBe(
      'Id mismatch',
    );
  });

  it('falls back to the status for unknown bodies', () => {
    expect(mapper.toMessage(httpError(500, '<html>'))).toBe('Serverfehler (HTTP 500).');
  });

  it('reports its own messages in the active language', () => {
    TestBed.inject(TranslocoService).setActiveLang('en');

    expect(mapper.toMessage(httpError(0))).toBe('Backend not reachable.');
    expect(mapper.toMessage(httpError(500, '<html>'))).toBe('Server error (HTTP 500).');
  });
});
