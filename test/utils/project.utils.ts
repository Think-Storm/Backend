import {
  Goal,
  LanguageCode,
  LanguageName,
  ProjectStatus,
  JoinRequestStatus,
  CreateJoinRequest,
} from '@think-storm/contracts';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CreateProjectRequestDto } from '../../src/modules/project/dtos/createProjectRequest.dto';
import { ProjectResponseDto } from '../../src/modules/project/dtos/projectResponse.dto';
import { ProjectRepository } from '../../src/modules/project/project.repository';
import { defaultUser } from './user.utils';
import { UpdateProjectRequestDto } from '../../src/modules/project/dtos/updateProjectRequest.dto';
import { SearchProjectDto } from '../../src/modules/project/dtos/searchProject.dto';
import { GetProjectRequestDto } from '../../src/modules/project/dtos/getProjectRequest.dto';
import { SearchProjectResponseDto } from './../../src/modules/project/dtos/searchProjectResponse.dto';
import { JoinRequestResponseDto } from '../../src/modules/project/dtos/joinRequestResponse.dto';
import { Project } from '@prisma/client';

/**
 *
 * @param prismaService - The Prisma service for database access.
 * @param defaultCreateProjectDto - Default Create Project DTO for creating project.
 * @returns The created project.
 */
export const createProjectInDB = async (
  prismaService: PrismaService,
  defaultCreateProjectDto: CreateProjectRequestDto,
): Promise<Project> => {
  const projectRepository = new ProjectRepository(prismaService);
  // Create a Project in DB and return it
  return await projectRepository.createProject(defaultCreateProjectDto);
};

/**
 *
 * @param prismaService - The Prisma service for database access
 */
export const createLanguagesInDB = async (prismaService: PrismaService) => {
  // Create a Language in DB (if is does not already exist) as project language
  await prismaService.language.upsert({
    where: { name: LanguageName.English },
    update: {},
    create: {
      code: LanguageCode.EN,
      name: LanguageName.English,
    },
  });

  // Create a Language in DB (if is does not already exist) as project language
  await prismaService.language.upsert({
    where: { name: LanguageName.Korean },
    update: {},
    create: {
      code: LanguageCode.KR,
      name: LanguageName.Korean,
    },
  });
};

/**
 *
 * @param prismaService - The Prisma service for database access.
 * @param createProjectRequestDto - Default Create Project Request DTO for creating project.
 * @returns The created project.
 */
export const createProject = async (prismaService, createProjectRequestDto) => {
  const createdProject = await prismaService.project.create({
    data: {
      title: createProjectRequestDto.title,
      description: createProjectRequestDto.description,
      goal: createProjectRequestDto.goal,
      status: createProjectRequestDto.status,
      milestone: createProjectRequestDto.milestone,
      founder: {
        connect: {
          id: createProjectRequestDto.founderId,
        },
      },
      language: {
        connect: {
          name: createProjectRequestDto.languageName,
        },
      },
      domainLabels: {
        create: createProjectRequestDto.domainLabels.map((domainLabel) => {
          return {
            label: {
              connect: {
                name: domainLabel,
              },
            },
          };
        }),
      },
      technicalLabels: {
        create: createProjectRequestDto.technicalLabels.map(
          (technicalLabel) => {
            return {
              label: {
                connect: {
                  name: technicalLabel,
                },
              },
            };
          },
        ),
      },
    },
    include: {
      language: true,
      users: {
        omit: {
          password: true,
          passwordSalt: true,
          passwordChangedAt: true,
        },
      },
      founder: {
        omit: {
          password: true,
          passwordSalt: true,
          passwordChangedAt: true,
        },
      },
      domainLabels: {
        include: {
          label: true,
        },
      },
      technicalLabels: {
        include: {
          label: true,
        },
      },
      like: true,
      involvement: true,
      joinRequest: {
        include: {
          user: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
        },
      },
      savedByUsers: {
        include: {
          user: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
        },
      },
    },
  });
  return createdProject;
};

export const secondProjectResponseDto: ProjectResponseDto = {
  id: 1,
  title: 'second title',
  description: 'second description',
  languageName: LanguageName.Korean,
  technicalLabels: ['aws', 'nextjs', 'gatsby'],
  domainLabels: ['Design', 'Mathematics', 'Mindfulness'],
  goal: Goal.Fun,
  status: ProjectStatus.Complete,
  users: [],
  milestone: new Date('2028-01-01'),
  createdAt: new Date('2025-01-01'),
  lastUpdatedAt: new Date('2025-01-01'),
  founder: defaultUser,
};

export const defaultCreateProjectRequestDto: CreateProjectRequestDto = {
  founderId: 1,
  title: 'title',
  description: 'description',
  goal: Goal.Education,
  status: ProjectStatus.InProgress,
  languageName: LanguageName.English,
  milestone: new Date('2000-01-01'),
  technicalLabels: ['nestjs', 'js', 'jest'],
  domainLabels: ['Cooking', 'Design', 'Geography'],
};

export const secondCreateProjectRequestDto: CreateProjectRequestDto = {
  founderId: 1,
  title: 'second title',
  description: 'second description',
  goal: Goal.Fun,
  status: ProjectStatus.Complete,
  languageName: LanguageName.Korean,
  milestone: new Date('2028-01-01'),
  technicalLabels: ['aws', 'nextjs', 'gatsby'],
  domainLabels: ['Design', 'Mathematics', 'Mindfulness'],
};

export const defaultProjectResponseDto: ProjectResponseDto = {
  id: 1,
  title: 'title',
  description: 'description',
  languageName: LanguageName.English,
  technicalLabels: ['nestjs', 'js', 'jest'],
  domainLabels: ['Cooking', 'Design', 'Geography'],
  goal: Goal.Education,
  status: ProjectStatus.InProgress,
  users: [],
  milestone: new Date('2000-01-01'),
  createdAt: new Date('2000-01-01'),
  lastUpdatedAt: new Date('2000-01-01'),
  founder: defaultUser,
};

export const defaultProject = {
  id: 1,
  founderId: 1,
  title: 'title',
  description: 'description',
  goal: Goal.Education,
  status: ProjectStatus.InProgress,
  languageName: LanguageName.English,
  milestone: new Date('2000-01-01'),
  createdAt: new Date('2000-01-01'),
  lastUpdatedAt: new Date('2000-01-01'),
  savedByUsers: [],
  language: {
    code: LanguageCode.EN,
    name: LanguageName.English,
    createdAt: new Date(),
    lastUpdatedAt: new Date(),
  },
  users: [],
  founder: defaultUser,
  technicalLabels: [
    { projectId: 1, labelName: 'nestjs', label: { name: 'nestjs' } },
    { projectId: 1, labelName: 'js', label: { name: 'js' } },
    { projectId: 1, labelName: 'jest', label: { name: 'jest' } },
  ],
  domainLabels: [
    { projectId: 1, labelName: 'Cooking', label: { name: 'Cooking' } },
    { projectId: 1, labelName: 'Design', label: { name: 'Design' } },
    { projectId: 1, labelName: 'Geography', label: { name: 'Geography' } },
  ],
  like: [],
  involvement: [],
  joinRequest: [],
};

export const secondProject = {
  id: 1,
  founderId: 1,
  title: 'second title',
  description: 'second description',
  goal: Goal.Fun,
  status: ProjectStatus.Complete,
  languageName: LanguageName.Korean,
  milestone: new Date('2028-01-01'),
  createdAt: new Date('2025-01-01'),
  lastUpdatedAt: new Date('2025-01-01'),
  savedByUsers: [],
  language: {
    code: LanguageCode.KR,
    name: LanguageName.Korean,
    createdAt: new Date(),
    lastUpdatedAt: new Date(),
  },
  users: [],
  founder: defaultUser,
  technicalLabels: [
    { projectId: 1, labelName: 'aws', label: { name: 'aws' } },
    { projectId: 1, labelName: 'nextjs', label: { name: 'nextjs' } },
    { projectId: 1, labelName: 'gatsby', label: { name: 'gatsby' } },
  ],
  domainLabels: [
    { projectId: 1, labelName: 'Design', label: { name: 'Design' } },
    { projectId: 1, labelName: 'Mathematics', label: { name: 'Mathematics' } },
    { projectId: 1, labelName: 'Mindfulness', label: { name: 'Mindfulness' } },
  ],
  like: [],
  involvement: [],
  joinRequest: [],
};

export const defaultUpdatedProject = {
  id: 1,
  founderId: 1,
  title: 'updatedTitle',
  description: 'updatedDescription',
  status: ProjectStatus.Complete,
  languageName: LanguageName.French,
  goal: Goal.OpenSource,
  milestone: new Date('2021-01-01'),
  createdAt: new Date('2000-01-01'),
  lastUpdatedAt: new Date('2000-01-01'),
};

export const defaultCreateProjectDto: CreateProjectRequestDto = {
  founderId: 1,
  title: 'title',
  description: 'description',
  technicalLabels: ['nestjs', 'js', 'jest'],
  domainLabels: [],
  goal: Goal.Education,
  status: ProjectStatus.InProgress,
  languageName: LanguageName.English,
  milestone: new Date('2000-01-01'),
};

export const defaultUpdateProjectDto: UpdateProjectRequestDto = {
  id: 1,
  founderId: 1,
  title: 'updatedTitle',
  description: 'updatedDescription',
  status: ProjectStatus.Complete,
  languageName: LanguageName.French,
  goal: Goal.OpenSource,
  milestone: new Date('2021-01-01'),
  domainLabels: ['Science', 'Technology'],
  technicalLabels: ['typescript', 'graphql'],
};

export const defaultDeleteProjectDto: GetProjectRequestDto = {
  id: 1,
};

export const defaultSearchProjectDto: SearchProjectDto = {
  title: 'title',
  languageName: LanguageName.English,
  description: 'description',
  status: ProjectStatus.InProgress,
  goal: Goal.Education,
  technicalLabels: 'nestjs,js,jest',
  domainLabels: 'Cooking,Design,Geography',
  mileStoneFrom: new Date('2000-01-01'),
  mileStoneTo: new Date('2030-01-01'),
  createdAtFrom: new Date('2000-01-01'),
  createdAtTo: new Date('2030-01-01'),
  lastUpdatedAtFrom: new Date('2000-01-01'),
  lastUpdatedAtTo: new Date('2030-01-01'),
  page: 1,
  limit: 10,
};

export const secondSearchProjectDto: SearchProjectDto = {
  technicalLabels: 'aws',
  domainLabels: 'Mathematics,Mindfulness',
  mileStoneFrom: new Date('2000-01-01'),
  mileStoneTo: new Date('2030-01-01'),
  createdAtFrom: new Date('2000-01-01'),
  createdAtTo: new Date('2030-01-01'),
  lastUpdatedAtFrom: new Date('2000-01-01'),
  lastUpdatedAtTo: new Date('2030-01-01'),
  page: 1,
  limit: 10,
};

export const searchProjectResponseDto: SearchProjectResponseDto = {
  projects: [defaultProjectResponseDto],
  page: 1,
  limit: 10,
  totalPages: 1,
  totalItems: 1,
};

export const defaultSortBy: Array<object> = [
  {
    lastUpdatedAt: 'desc',
  },
  {
    createdAt: 'desc',
  },
];

export const defaultSavedProject = {
  ...defaultProject,
  savedByUsers: [
    {
      userId: defaultUser.id,
      projectId: defaultProject.id,
      savedAt: new Date(),
      user: {
        ...defaultUser,
      },
    },
  ],
};

// Define the necessary structure for testing the mapper
export type MockProjectDomainLabel = {
  projectId?: number;
  labelName?: string;
};

export type MockProjectTechnicalLabel = {
  projectId?: number;
  labelName?: string;
};

export type MockProjectWithLabels = {
  id: number;
  founderId: number;
  title: string;
  description: string | null;
  goal: Goal;
  status: ProjectStatus;
  languageName: LanguageName;
  milestone: Date | null;
  createdAt: Date;
  lastUpdatedAt: Date;
  domainLabels?: MockProjectDomainLabel[];
  technicalLabels?: MockProjectTechnicalLabel[];
  language?: {
    code: LanguageCode;
    name: LanguageName;
    createdAt: Date;
    lastUpdatedAt: Date;
  } | null;
  founder?: typeof defaultUser;
  savedByUsers?: any[];
  users?: any[];
  like?: any[];
  involvement?: any[];
  joinRequest?: any[];
};

export const defaultJoinRequest = {
  userId: 1,
  projectId: 1,
  roleName: 'Developer',
  status: JoinRequestStatus.Pending,
  message: 'I would love to contribute!',
};

export const defaultCreateJoinRequestDto: CreateJoinRequest = {
  roleName: 'Developer',
  message: 'I would love to contribute!',
};

export const defaultJoinRequestResponseDto: JoinRequestResponseDto = {
  userId: 1,
  projectId: 1,
  roleName: 'Developer',
  status: JoinRequestStatus.Pending,
  message: 'I would love to contribute!',
};
