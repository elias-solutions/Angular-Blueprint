import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

/** Covers RFC 9457 problem details, ASP.NET validation problems and the blueprints' `{title,status,detail}`. */
interface ProblemBody {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

const RATE_LIMIT_STATUSES = [429, 503];

/** Turns any error raised by a backend call into a user-facing (German) message. */
@Injectable({ providedIn: 'root' })
export class ApiErrorMapper {
  toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return this.fromHttp(error);
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unbekannter Fehler.';
  }

  private fromHttp(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Backend nicht erreichbar.';
    }
    if (RATE_LIMIT_STATUSES.includes(error.status)) {
      return 'Zu viele Anfragen – bitte einen Moment warten.';
    }
    const problem = asProblem(error.error);
    const validationMessages = Object.values(problem?.errors ?? {}).flat();
    if (validationMessages.length > 0) {
      return validationMessages.join(' ');
    }
    return problem?.detail || problem?.title || `Serverfehler (HTTP ${error.status}).`;
  }
}

function asProblem(body: unknown): ProblemBody | null {
  return typeof body === 'object' && body !== null ? (body as ProblemBody) : null;
}
