export enum GENDER {
  MALE,
  FEMALE,
}

// ['MALE', 'FEMALE'];
export const ACCOUNT_GENDER_ARRAY =
  Object.values(GENDER).filter(it => isNaN(it as number));
