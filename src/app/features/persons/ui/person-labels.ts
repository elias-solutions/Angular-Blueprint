import { Gender, PersonType } from '../domain/person';

const NOT_SET = '–';

export const GENDER_LABELS: Readonly<Record<Gender, string>> = {
  Male: 'Männlich',
  Female: 'Weiblich',
};

export const PERSON_TYPE_LABELS: Readonly<Record<PersonType, string>> = {
  Freelancer: 'Freelancer',
  Employee: 'Angestellt',
};

export function genderLabel(gender: Gender | null): string {
  return gender ? GENDER_LABELS[gender] : NOT_SET;
}

export function personTypeLabel(type: PersonType | null): string {
  return type ? PERSON_TYPE_LABELS[type] : NOT_SET;
}
