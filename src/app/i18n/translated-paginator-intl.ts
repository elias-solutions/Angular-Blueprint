import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService } from '@jsverse/transloco';

/** Paginator texts from the translations, refreshed on every language change. */
@Injectable()
export class TranslatedPaginatorIntl extends MatPaginatorIntl {
  private readonly transloco = inject(TranslocoService);

  constructor() {
    super();
    this.transloco.langChanges$.pipe(takeUntilDestroyed()).subscribe(() => this.translate());
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this.transloco.translate('paginator.emptyRange', { length });
    }
    const start = page * pageSize;
    const end = Math.min(start + pageSize, length);
    return this.transloco.translate('paginator.range', { start: start + 1, end, length });
  };

  private translate(): void {
    this.itemsPerPageLabel = this.transloco.translate('paginator.itemsPerPage');
    this.firstPageLabel = this.transloco.translate('paginator.firstPage');
    this.lastPageLabel = this.transloco.translate('paginator.lastPage');
    this.nextPageLabel = this.transloco.translate('paginator.nextPage');
    this.previousPageLabel = this.transloco.translate('paginator.previousPage');
    this.changes.next();
  }
}
