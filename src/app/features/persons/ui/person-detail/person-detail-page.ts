import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LocalizedDatePipe } from '../../../../i18n/localized-date.pipe';
import { Address, Person, toAddressDraft, toPersonDraft } from '../../domain/person';
import {
  withAddressAdded,
  withAddressRemoved,
  withAddressReplaced,
} from '../../domain/person-addresses';
import { PersonsStore } from '../../state/persons-store';
import { PersonDialogs } from '../person-dialogs';
import { genderLabelKey, personTypeLabelKey } from '../person-labels';

@Component({
  selector: 'app-person-detail-page',
  imports: [
    TranslocoPipe,
    LocalizedDatePipe,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './person-detail-page.html',
  styleUrl: './person-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonDetailPage {
  readonly id = input.required<string>();

  protected readonly store = inject(PersonsStore);
  private readonly dialogs = inject(PersonDialogs);
  private readonly router = inject(Router);

  protected readonly person = computed(() => {
    const selected = this.store.selected();
    return selected?.id === this.id() ? selected : null;
  });
  protected readonly addressColumns = ['street', 'postalCode', 'city', 'changed', 'actions'];
  protected readonly genderLabelKey = genderLabelKey;
  protected readonly personTypeLabelKey = personTypeLabelKey;

  constructor() {
    effect(() => {
      this.store.activeApi();
      const id = this.id();
      untracked(() => void this.store.loadPerson(id));
    });
  }

  protected async editPerson(person: Person): Promise<void> {
    const result = await this.dialogs.editPerson(person);
    if (result) {
      await this.store.update(person, { ...toPersonDraft(person), ...result });
    }
  }

  protected async removePerson(person: Person): Promise<void> {
    if ((await this.dialogs.confirmDeletePerson(person)) && (await this.store.remove(person))) {
      void this.router.navigate(['/persons']);
    }
  }

  protected async addAddress(person: Person): Promise<void> {
    const address = await this.dialogs.editAddress();
    if (address) {
      await this.store.update(person, withAddressAdded(toPersonDraft(person), address));
    }
  }

  protected async editAddress(person: Person, address: Address): Promise<void> {
    const changed = await this.dialogs.editAddress(toAddressDraft(address));
    if (changed) {
      await this.store.update(
        person,
        withAddressReplaced(toPersonDraft(person), address.id, changed),
      );
    }
  }

  protected async removeAddress(person: Person, address: Address): Promise<void> {
    if (await this.dialogs.confirmDeleteAddress(address)) {
      await this.store.update(person, withAddressRemoved(toPersonDraft(person), address.id));
    }
  }
}
