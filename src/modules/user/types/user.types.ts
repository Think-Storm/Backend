import { Project, User } from '@think-storm/contracts';

export type UserWithoutSensitiveData = Omit<
  User,
  'password' | 'passwordSalt' | 'passwordChangedAt'
>;

export type UserWithRelations = User & {
  savedProjects?: {
    savedAt: Date;
    project: Project;
  }[];
};
