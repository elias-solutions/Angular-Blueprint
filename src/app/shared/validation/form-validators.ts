import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Mirrors Java's `@NotBlank`: whitespace-only input is rejected like empty input. */
export function notBlank(control: AbstractControl<string | null>): ValidationErrors | null {
  return (control.value ?? '').trim() === '' ? { blank: true } : null;
}

export function notInFuture(control: AbstractControl<Date | null>): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return value.getTime() > endOfToday.getTime() ? { future: true } : null;
}
