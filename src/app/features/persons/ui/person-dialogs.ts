import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';
import { AddressDraft, Person } from '../domain/person';
import { AddressDialog, AddressDialogData } from './address-dialog/address-dialog';
import { PersonDialog, PersonDialogData, PersonDialogResult } from './person-dialog/person-dialog';

/** Opens the persons feature's dialogs; resolves `undefined` when the user cancels. */
@Injectable({ providedIn: 'root' })
export class PersonDialogs {
  private readonly dialog = inject(MatDialog);

  editPerson(person?: Person): Promise<PersonDialogResult | undefined> {
    const ref = this.dialog.open<PersonDialog, PersonDialogData, PersonDialogResult>(PersonDialog, {
      data: { person },
      width: '520px',
    });
    return firstValueFrom(ref.afterClosed());
  }

  editAddress(address?: AddressDraft): Promise<AddressDraft | undefined> {
    const ref = this.dialog.open<AddressDialog, AddressDialogData, AddressDraft>(AddressDialog, {
      data: { address },
      width: '560px',
    });
    return firstValueFrom(ref.afterClosed());
  }

  async confirm(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data,
      width: '420px',
    });
    return (await firstValueFrom(ref.afterClosed())) === true;
  }
}
