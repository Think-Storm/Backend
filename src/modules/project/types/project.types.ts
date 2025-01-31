import {
  Involvement,
  JoinRequest,
  Language,
  Like,
  Project,
  ProjectDomainLabel,
  ProjectTechnicalLabel,
  User,
} from '@prisma/client';

export type ProjectWithLabels = Project & {
  domainLabels?: (ProjectDomainLabel & {
    label: { name: string };
  })[];
  technicalLabels?: (ProjectTechnicalLabel & {
    label: { name: string };
  })[];
  language?: Language;
  users?: User[];
  founder?: User;
  like?: Like[];
  involvement?: Involvement[];
  joinRequest?: JoinRequest[];
};
