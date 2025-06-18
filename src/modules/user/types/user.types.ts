import { User } from '@think-storm/contracts';

export type UserWithoutSensitiveData = Omit<
  User,
  'password' | 'passwordSalt' | 'passwordChangedAt'
>;
