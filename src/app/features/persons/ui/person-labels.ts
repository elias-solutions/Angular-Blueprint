import { Gender, PersonType } from '../domain/person';

const NOT_SET_KEY = 'common.notSet';

/** Translation key of a gender, or of the "not set" placeholder. */
export function genderLabelKey(gender: Gender | null): string {
  return gender ? `person.genders.${gender}` : NOT_SET_KEY;
}

/** Translation key of a person type, or of the "not set" placeholder. */
export function personTypeLabelKey(type: PersonType | null): string {
  return type ? `person.types.${type}` : NOT_SET_KEY;
}
