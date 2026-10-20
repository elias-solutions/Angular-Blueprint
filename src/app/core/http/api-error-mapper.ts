import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

interface ProblemBody {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

const RATE_LIMIT_STATUSES = [429, 503];
const STATUS_MESSAGE_KEYS: Readonly<Record<number, string>> = {
  401: 'errors.unauthorized',
  403: 'errors.forbidden',
};

@Injectable({ providedIn: 'root' })
export class ApiErrorMapper {
  private readonly transloco = inject(TranslocoService);

  toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return this.fromHttp(error);
    }
    if (error instanceof Error) {
      return error.message;
    }
    return this.transloco.translate('errors.unknown');
  }

  private fromHttp(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return this.transloco.translate('errors.unreachable');
    }
    if (RATE_LIMIT_STATUSES.includes(error.status)) {
      return this.transloco.translate('errors.rateLimited');
    }
    const statusKey = STATUS_MESSAGE_KEYS[error.status];
    if (statusKey) {
      return this.transloco.translate(statusKey);
    }
    const problem = asProblem(error.error);
    const validationMessages = Object.values(problem?.errors ?? {}).flat();
    if (validationMessages.length > 0) {
      return validationMessages.join(' ');
    }
    return (
      problem?.detail ||
      problem?.title ||
      this.transloco.translate('errors.server', { status: error.status })
    );
  }
}

function asProblem(body: unknown): ProblemBody | null {
  return typeof body === 'object' && body !== null ? (body as ProblemBody) : null;
}
