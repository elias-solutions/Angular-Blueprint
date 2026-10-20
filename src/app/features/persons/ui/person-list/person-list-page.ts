import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../../../i18n/language.service';
import { LocalizedDatePipe, formatIsoDate } from '../../../../i18n/localized-date.pipe';
import { Person, toPersonDraft } from '../../domain/person';
import { PersonChanges } from '../../state/person-changes';
import { PersonsStore } from '../../state/persons-store';
import { PersonDialogs } from '../person-dialogs';
import { personTypeLabelKey } from '../person-labels';
import { PersonTableText, personMatchesFilter, personSortValue } from './person-table';

@Component({
  selector: 'app-person-list-page',
  imports: [
    TranslocoPipe,
    LocalizedDatePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './person-list-page.html',
  styleUrl: './person-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonListPage {
  protected readonly store = inject(PersonsStore);
  private readonly dialogs = inject(PersonDialogs);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly language = inject(LanguageService);
  private readonly changes = inject(PersonChanges);
  private readonly sort = viewChild.required(MatSort);
  private readonly paginator = viewChild.required(MatPaginator);

  protected readonly columns = ['lastName', 'firstName', 'birthday', 'type', 'changed', 'actions'];
  protected readonly personTypeLabelKey = personTypeLabelKey;
  protected readonly dataSource = new MatTableDataSource<Person>([]);
  protected readonly filter = signal('');

  private readonly tableText: PersonTableText = {
    typeLabel: (type) => this.transloco.translate(personTypeLabelKey(type)),
    date: (isoDate) => formatIsoDate(isoDate, this.language.format()),
  };

  constructor() {
    this.dataSource.filterPredicate = (person, filter) =>
      personMatchesFilter(person, filter, this.tableText);
    this.dataSource.sortingDataAccessor = (person, column) =>
      personSortValue(person, column, this.tableText);

    effect(() => {
      this.store.activeApi();
      this.changes.revision();
      untracked(() => void this.store.load());
    });
    effect(() => (this.dataSource.data = [...this.store.persons()]));
    effect(() => (this.dataSource.filter = this.filter().trim().toLowerCase()));
    effect(() => {
      this.dataSource.sort = this.sort();
      this.dataSource.paginator = this.paginator();
    });
  }

  protected reload(): void {
    void this.store.load();
  }

  protected open(person: Person): void {
    void this.router.navigate(['/persons', person.id]);
  }

  protected async create(): Promise<void> {
    const result = await this.dialogs.editPerson();
    if (!result) {
      return;
    }
    const id = await this.store.create({ ...result, addresses: [] });
    if (id) {
      void this.router.navigate(['/persons', id]);
    }
  }

  protected async edit(person: Person): Promise<void> {
    const result = await this.dialogs.editPerson(person);
    if (result) {
      await this.store.update(person, { ...toPersonDraft(person), ...result });
    }
  }

  protected async remove(person: Person): Promise<void> {
    if (await this.dialogs.confirmDeletePerson(person)) {
      await this.store.remove(person);
    }
  }
}
