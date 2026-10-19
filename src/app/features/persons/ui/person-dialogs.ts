import { Injectable, inject } from '@angular/core';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';
import { AppDialog } from '../../../shared/dialog/app-dialog';
import { AddressDraft, Person } from '../domain/person';
import { AddressDialog, AddressDialogData } from './address-dialog/address-dialog';
import { PersonDialog, PersonDialogData, PersonDialogResult } from './person-dialog/person-dialog';

/** Opens the persons feature's dialogs; resolves `undefined` when the user cancels. */
@Injectable({ providedIn: 'root' })
export class PersonDialogs {
  private readonly dialog = inject(AppDialog);

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

  async confirm(data: ConfirmDialogData): Promise<boolean> {
    const confirmed = await this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(
      ConfirmDialog,
      data,
    );
    return confirmed === true;
  }
}
