import {
  Goal,
  LanguageCode,
  LanguageName,
  Project,
  ProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CreateProjectRequestDto } from '../../src/modules/project/dtos/createProjectRequest.dto';
import { ProjectResponseDto } from '../../src/modules/project/dtos/projectResponse.dto';
import { ProjectRepository } from '../../src/modules/project/project.repository';
import { defaultCreateUserDto, defaultUser } from './user.utils';
import { UpdateProjectRequestDto } from '../../src/modules/project/dtos/updateProjectRequest.dto';
import { UserRepository } from '../../src/modules/user/user.repository';
import { defaultPasswordSalt } from '../../test/unit/common/passwordEncryption.utils';
import { SearchProjectDto } from '../../src/modules/project/dtos/searchProject.dto';
import { GetProjectRequestDto } from '../../src/modules/project/dtos/getProjectRequest.dto';
import { SearchProjectResponseDto } from './../../src/modules/project/dtos/searchProjectResponse.dto';

export const createProjectInDB = async (
  prismaService: PrismaService,
  defaultCreateProjectDto: CreateProjectRequestDto,
): Promise<Project> => {
  const projectRepository = new ProjectRepository(prismaService);
  // Create a Project in DB and return it
  return await projectRepository.createProject(defaultCreateProjectDto);
};

/**
 * Creates a project in the database.
 * @param prismaService - The Prisma service for database access.
 * @param UserRepository - The user repository for user-related database operations.
 * @returns The created project.
 */
export const createProjectInDBWithUser = async (
  prismaService: PrismaService,
  userRepository: UserRepository,
  createProjectRequestDto: CreateProjectRequestDto,
): Promise<Project> => {
  // Create a User in DB as project founder
  await userRepository.createUser(defaultCreateUserDto, defaultPasswordSalt);

  // Create a Language in DB (if is does not already exist) as project language
  await prismaService.language.upsert({
    where: { code: LanguageCode.EN },
    update: {},
    create: {
      code: LanguageCode.EN,
      name: LanguageName.English,
    },
  });

  // Create a Language in DB (if is does not already exist) as project language
  await prismaService.language.upsert({
    where: { code: LanguageCode.KR },
    update: {},
    create: {
      code: LanguageCode.KR,
      name: LanguageName.Korean,
    },
  });

  // Create a Project in DB and return it
  return await createProject(prismaService, createProjectRequestDto);
};

export const createProject = async (prismaService, createProjectRequestDto) => {
  const createdProject = await prismaService.project.create({
    data: {
      founderId: createProjectRequestDto.founderId,
      title: createProjectRequestDto.title,
      description: createProjectRequestDto.description,
      technicalLabels: {
        create: createProjectRequestDto.technicalLabels?.map(
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
      domainLabels: {
        create: createProjectRequestDto.domainLabels?.map((domainLabel) => {
          return {
            label: {
              connect: {
                name: domainLabel,
              },
            },
          };
        }),
      },
      goal: createProjectRequestDto.goal,
      status: createProjectRequestDto.status,
      languageCode: createProjectRequestDto.languageCode,
      milestone: createProjectRequestDto.milestone,
      createdAt: new Date('2000-01-01'),
      lastUpdatedAt: new Date('2000-01-01'),
    },
    include: {
      language: true,
      users: true,
      founder: true,
      domainLabels: true,
      technicalLabels: true,
      like: true,
      involvement: true,
      joinRequest: true,
    },
  });
  return createdProject;
};

export const secondProjectResponseDto: ProjectResponseDto = {
  id: 1,
  title: 'second title',
  description: 'second description',
  language: {
    code: LanguageCode.KR,
    name: LanguageName.Korean,
    createdAt: new Date('2025-01-01'),
    lastUpdatedAt: new Date('2025-01-01'),
  },
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
  languageCode: LanguageCode.EN,
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
  languageCode: LanguageCode.KR,
  milestone: new Date('2028-01-01'),
  technicalLabels: ['aws', 'nextjs', 'gatsby'],
  domainLabels: ['Design', 'Mathematics', 'Mindfulness'],
};

export const defaultProjectResponseDto: ProjectResponseDto = {
  id: 1,
  title: 'title',
  description: 'description',
  language: {
    code: LanguageCode.EN,
    name: LanguageName.English,
    createdAt: new Date('2000-01-01'),
    lastUpdatedAt: new Date('2000-01-01'),
  },
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

export const defaultProject: Project = {
  id: 1,
  founderId: 1,
  title: 'title',
  description: 'description',
  goal: Goal.Education,
  status: ProjectStatus.InProgress,
  languageCode: LanguageCode.EN,
  milestone: new Date('2000-01-01'),
  createdAt: new Date('2000-01-01'),
  lastUpdatedAt: new Date('2000-01-01'),
};

export const secondProject: Project = {
  id: 1,
  founderId: 1,
  title: 'second title',
  description: 'second description',
  goal: Goal.Fun,
  status: ProjectStatus.Complete,
  languageCode: LanguageCode.KR,
  milestone: new Date('2028-01-01'),
  createdAt: new Date('2025-01-01'),
  lastUpdatedAt: new Date('2025-01-01'),
};

export const defaultUpdatedProject: Project = {
  id: 1,
  founderId: 1,
  title: 'updatedTitle',
  description: 'updatedDescription',
  status: ProjectStatus.Complete,
  languageCode: LanguageCode.FR,
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
  languageCode: LanguageCode.EN,
  milestone: new Date('2000-01-01'),
};

export const defaultUpdateProjectDto: UpdateProjectRequestDto = {
  id: 1,
  founderId: 1,
  title: 'updatedTitle',
  description: 'updatedDescription',
  status: ProjectStatus.Complete,
  languageCode: LanguageCode.FR,
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
  languageCode: 'EN',
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

// Define the necessary structure for testing the mapper
export type MockProjectDomainLabel = {
  projectId?: number;
  labelName?: string;
  label: { name: string };
};

export type MockProjectTechnicalLabel = {
  projectId?: number;
  labelName?: string;
  label: { name: string };
};

export type MockProjectWithLabels = {
  id: number;
  founderId: number;
  title: string;
  description: string | null;
  goal: Goal;
  status: ProjectStatus;
  languageCode: LanguageCode;
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
  users?: any[];
  like?: any[];
  involvement?: any[];
  joinRequest?: any[];
};
