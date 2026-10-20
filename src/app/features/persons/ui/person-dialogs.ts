import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';
import { AppDialog } from '../../../shared/dialog/app-dialog';
import { Address, AddressDraft, Person, addressLine, fullName } from '../domain/person';
import { AddressDialog, AddressDialogData } from './address-dialog/address-dialog';
import { PersonDialog, PersonDialogData, PersonDialogResult } from './person-dialog/person-dialog';

@Injectable({ providedIn: 'root' })
export class PersonDialogs {
  private readonly dialog = inject(AppDialog);
  private readonly transloco = inject(TranslocoService);

  editPerson(person?: Person): Promise<PersonDialogResult | undefined> {
    return this.dialog.open<PersonDialog, PersonDialogData, PersonDialogResult>(PersonDialog, {
      person,
    });
  }

  editAddress(address?: AddressDraft): Promise<AddressDraft | undefined> {
    return this.dialog.open<AddressDialog, AddressDialogData, AddressDraft>(AddressDialog, {
      address,
    });
  }

  confirmDeletePerson(person: Person): Promise<boolean> {
    return this.confirmDelete(
      'persons.confirm.deletePersonTitle',
      this.transloco.translate('persons.confirm.deletePersonMessage', { name: fullName(person) }),
    );
  }

  confirmDeleteAddress(address: Address): Promise<boolean> {
    return this.confirmDelete(
      'persons.confirm.deleteAddressTitle',
      this.transloco.translate('persons.confirm.deleteAddressMessage', {
        address: addressLine(address),
      }),
    );
  }

  private async confirmDelete(titleKey: string, message: string): Promise<boolean> {
    const confirmed = await this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(
      ConfirmDialog,
      {
        title: this.transloco.translate(titleKey),
        message,
        confirmLabel: this.transloco.translate('common.delete'),
      },
    );
    return confirmed === true;
  }
}
