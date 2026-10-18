import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { parseIsoDate, toIsoDate } from '../../../../shared/date/iso-date';
import { notBlank, notInFuture } from '../../../../shared/validation/form-validators';
import { Person, PersonDraft } from '../../domain/person';
import { TEXT_MAX_LENGTH } from '../field-limits';

export interface PersonDialogData {
  /** Absent when creating a new person. */
  readonly person?: Person;
}

export type PersonDialogResult = Pick<PersonDraft, 'firstName' | 'lastName' | 'birthday'>;

@Component({
  selector: 'app-person-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
  ],
  templateUrl: './person-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonDialog {
  private readonly dialogRef = inject<MatDialogRef<PersonDialog, PersonDialogResult>>(MatDialogRef);
  private readonly person = inject<PersonDialogData>(MAT_DIALOG_DATA).person;
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly maxLength = TEXT_MAX_LENGTH;
  protected readonly today = new Date();
  protected readonly isEdit = this.person !== undefined;
  protected readonly form = this.fb.group({
    firstName: [this.person?.firstName ?? '', [notBlank, Validators.maxLength(TEXT_MAX_LENGTH)]],
    lastName: [this.person?.lastName ?? '', [notBlank, Validators.maxLength(TEXT_MAX_LENGTH)]],
    birthday: this.fb.control<Date | null>(
      this.person ? parseIsoDate(this.person.birthday) : null,
      [Validators.required, notInFuture],
    ),
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { firstName, lastName, birthday } = this.form.getRawValue();
    this.dialogRef.close({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthday: toIsoDate(birthday!),
    });
  }
}
