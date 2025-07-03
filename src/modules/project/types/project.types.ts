import {
  Involvement,
  Language,
  Like,
  Prisma,
  Project,
  ProjectDomainLabel,
  ProjectTechnicalLabel,
} from '@prisma/client';
import { UserWithoutSensitiveData } from '../../../../src/modules/user/types/user.types';

export type ProjectWithRelations = Project & {
  domainLabels?: (ProjectDomainLabel & {
    label: { name: string };
  })[];
  technicalLabels?: (ProjectTechnicalLabel & {
    label: { name: string };
  })[];
  language?: Language;
  users?: UserWithoutSensitiveData[];
  founder?: UserWithoutSensitiveData;
  like?: Like[];
  involvement?: Involvement[];
  joinRequest?: {
    user: UserWithoutSensitiveData;
  }[];
  savedByUsers?: {
    savedAt: Date;
    user: UserWithoutSensitiveData;
  }[];
};

export type PrismaProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    language: true;
    users: {
      omit: {
        password: true;
        passwordSalt: true;
        passwordChangedAt: true;
      };
    };
    founder: {
      omit: {
        password: true;
        passwordSalt: true;
        passwordChangedAt: true;
      };
    };
    savedByUsers: {
      include: {
        user: {
          omit: {
            password: true;
            passwordSalt: true;
            passwordChangedAt: true;
          };
        };
      };
    };
    joinRequest: {
      include: {
        user: {
          omit: {
            password: true;
            passwordSalt: true;
            passwordChangedAt: true;
          };
        };
      };
    };
  };
}>;
