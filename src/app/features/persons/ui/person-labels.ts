import { Gender, PersonType } from '../domain/person';

const NOT_SET_KEY = 'common.notSet';

export function genderLabelKey(gender: Gender | null): string {
  return gender ? `person.genders.${gender}` : NOT_SET_KEY;
}

export function personTypeLabelKey(type: PersonType | null): string {
  return type ? `person.types.${type}` : NOT_SET_KEY;
}
