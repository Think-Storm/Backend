import { Project, User } from '@prisma/client';

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
