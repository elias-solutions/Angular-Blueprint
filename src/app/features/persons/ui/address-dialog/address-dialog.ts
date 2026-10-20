import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@jsverse/transloco';
import { notBlank } from '../../../../shared/validation/form-validators';
import { AddressDraft } from '../../domain/person';
import { TEXT_MAX_LENGTH } from '../field-limits';

export interface AddressDialogData {
  readonly address?: AddressDraft;
}

@Component({
  selector: 'app-address-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslocoPipe,
  ],
  templateUrl: './address-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressDialog {
  private readonly dialogRef = inject<MatDialogRef<AddressDialog, AddressDraft>>(MatDialogRef);
  private readonly address = inject<AddressDialogData>(MAT_DIALOG_DATA).address;
  private readonly required = [notBlank, Validators.maxLength(TEXT_MAX_LENGTH)];

  protected readonly maxLength = TEXT_MAX_LENGTH;
  protected readonly isEdit = this.address !== undefined;
  protected readonly form = inject(NonNullableFormBuilder).group({
    street: [this.address?.street ?? '', this.required],
    number: [this.address?.number ?? '', this.required],
    postalCode: [this.address?.postalCode ?? '', this.required],
    city: [this.address?.city ?? '', this.required],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { street, number, postalCode, city } = this.form.getRawValue();
    this.dialogRef.close({
      id: this.address?.id ?? null,
      street: street.trim(),
      number: number.trim(),
      postalCode: postalCode.trim(),
      city: city.trim(),
    });
  }
}
