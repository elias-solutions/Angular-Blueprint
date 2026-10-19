import { DatePipe } from '@angular/common';
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
import { Address, Person, fullName, toAddressDraft, toPersonDraft } from '../../domain/person';
import {
  withAddressAdded,
  withAddressRemoved,
  withAddressReplaced,
} from '../../domain/person-addresses';
import { PersonsStore } from '../../state/persons-store';
import { PersonDialogs } from '../person-dialogs';
import { genderLabel, personTypeLabel } from '../person-labels';

@Component({
  selector: 'app-person-detail-page',
  imports: [
    DatePipe,
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
  /** Bound from the `:id` route parameter. */
  readonly id = input.required<string>();

  protected readonly store = inject(PersonsStore);
  private readonly dialogs = inject(PersonDialogs);
  private readonly router = inject(Router);

  protected readonly person = computed(() => {
    const selected = this.store.selected();
    return selected?.id === this.id() ? selected : null;
  });
  protected readonly addressColumns = ['street', 'postalCode', 'city', 'changed', 'actions'];
  protected readonly readOnlyHint = 'Das aktive Backend ist schreibgeschützt.';
  protected readonly genderLabel = genderLabel;
  protected readonly personTypeLabel = personTypeLabel;

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
    const confirmed = await this.dialogs.confirm({
      title: 'Person löschen',
      message: `${fullName(person)} inklusive aller Adressen endgültig löschen?`,
      confirmLabel: 'Löschen',
    });
    if (confirmed && (await this.store.remove(person))) {
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
    const confirmed = await this.dialogs.confirm({
      title: 'Adresse löschen',
      message: `${address.street} ${address.number}, ${address.postalCode} ${address.city} löschen?`,
      confirmLabel: 'Löschen',
    });
    if (confirmed) {
      await this.store.update(person, withAddressRemoved(toPersonDraft(person), address.id));
    }
  }
}
