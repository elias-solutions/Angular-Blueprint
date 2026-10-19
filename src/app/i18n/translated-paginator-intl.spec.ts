import { TestBed } from '@angular/core/testing';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService } from '@jsverse/transloco';
import { TranslatedPaginatorIntl } from './translated-paginator-intl';
import { translocoTesting } from './testing/transloco-testing';

describe('TranslatedPaginatorIntl', () => {
  let intl: MatPaginatorIntl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [translocoTesting()],
      providers: [{ provide: MatPaginatorIntl, useClass: TranslatedPaginatorIntl }],
    });
    intl = TestBed.inject(MatPaginatorIntl);
  });

  it('uses the active language', () => {
    expect(intl.itemsPerPageLabel).toBe('Einträge pro Seite');
    expect(intl.getRangeLabel(1, 10, 25)).toBe('11 – 20 von 25');
    expect(intl.getRangeLabel(0, 10, 0)).toBe('0 von 0');
  });

  it('follows language changes and notifies the paginator', () => {
    const changed = jest.fn();
    intl.changes.subscribe(changed);

    TestBed.inject(TranslocoService).setActiveLang('en');

    expect(intl.itemsPerPageLabel).toBe('Items per page');
    expect(intl.getRangeLabel(2, 10, 25)).toBe('21 – 25 of 25');
    expect(changed).toHaveBeenCalled();
  });
});
