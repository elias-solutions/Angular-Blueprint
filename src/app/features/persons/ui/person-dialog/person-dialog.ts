import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';
import { parseIsoDate, toIsoDate } from '../../../../shared/date/iso-date';
import { notBlank, notInFuture } from '../../../../shared/validation/form-validators';
import {
  GENDERS,
  Gender,
  PERSON_TYPES,
  Person,
  PersonProfile,
  PersonType,
} from '../../domain/person';
import {
  DESCRIPTION_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  TEXT_MAX_LENGTH,
} from '../field-limits';
import { genderLabelKey, personTypeLabelKey } from '../person-labels';

export interface PersonDialogData {
  /** Absent when creating a new person. */
  readonly person?: Person;
}

export type PersonDialogResult = PersonProfile;

@Component({
  selector: 'app-person-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    TranslocoPipe,
  ],
  templateUrl: './person-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonDialog {
  private readonly dialogRef = inject<MatDialogRef<PersonDialog, PersonDialogResult>>(MatDialogRef);
  private readonly person = inject<PersonDialogData>(MAT_DIALOG_DATA).person;
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly maxLength = TEXT_MAX_LENGTH;
  protected readonly descriptionMaxLength = DESCRIPTION_MAX_LENGTH;
  protected readonly emailMaxLength = EMAIL_MAX_LENGTH;
  protected readonly phoneMaxLength = PHONE_MAX_LENGTH;
  protected readonly genders = GENDERS;
  protected readonly genderLabelKey = genderLabelKey;
  protected readonly personTypes = PERSON_TYPES;
  protected readonly personTypeLabelKey = personTypeLabelKey;
  protected readonly today = new Date();
  protected readonly isEdit = this.person !== undefined;
  protected readonly form = this.fb.group({
    firstName: [this.person?.firstName ?? '', [notBlank, Validators.maxLength(TEXT_MAX_LENGTH)]],
    lastName: [this.person?.lastName ?? '', [notBlank, Validators.maxLength(TEXT_MAX_LENGTH)]],
    birthday: this.fb.control<Date | null>(
      this.person?.birthday ? parseIsoDate(this.person.birthday) : null,
      [notInFuture],
    ),
    gender: this.fb.control<Gender | null>(this.person?.gender ?? null),
    type: this.fb.control<PersonType | null>(this.person?.type ?? null),
    email: [this.person?.email ?? '', [Validators.email, Validators.maxLength(EMAIL_MAX_LENGTH)]],
    phone: [this.person?.phone ?? '', [Validators.maxLength(PHONE_MAX_LENGTH)]],
    description: [this.person?.description ?? '', [Validators.maxLength(DESCRIPTION_MAX_LENGTH)]],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      birthday: value.birthday ? toIsoDate(value.birthday) : null,
      gender: value.gender,
      type: value.type,
      email: blankToNull(value.email),
      phone: blankToNull(value.phone),
      description: blankToNull(value.description),
    });
  }
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
