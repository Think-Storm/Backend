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
import { defaultUser } from './user.utils';
import { UpdateProjectRequestDto } from '../../src/modules/project/dtos/updateProjectRequest.dto';
export const createProjectInDB = async (
  prismaService: PrismaService,
  defaultCreateProjectDto: CreateProjectRequestDto,
): Promise<Project> => {
  const projectRepository = new ProjectRepository(prismaService);
  // Create a Project in DB and return it
  return projectRepository.createProject(defaultCreateProjectDto);
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
  technicalLabels: ['NestJS', 'JavaScript', 'Jest'],
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
  technicalLabels: ['NestJS', 'JavaScript', 'Jest'],
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
  technicalLabels: ['TypeScript', 'GraphQL'],
};
