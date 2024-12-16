import {
  Goal,
  LanguageCode,
  LanguageName,
  Project,
  ProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { defaultCreateUserDto } from '../user/user.utils';
import { defaultPasswordSalt } from '../../common/passwordEncryption.utils';
import { ProjectResponseDto } from '../../../../src/modules/project/dtos/projectResponse.dto';
import { defaultUser } from '../user/user.utils';
import { CreateProjectRequestDto } from 'src/modules/project/dtos/createProjectRequest.dto';
import { UserRepository } from 'src/modules/user/user.repository';

export class ProjectTestUtils {
  /**
   * Creates a project in the database.
   * @param prismaService - The Prisma service for database access.
   * @param UserRepository - The user repository for user-related database operations.
   * @returns The created project.
   */
  async createProjectInDB(
    prismaService: PrismaService,
    userRepository: UserRepository,
  ): Promise<Project> {
    // Create a User in DB as project founder
    const insertedUser = await userRepository.createUser(
      defaultCreateUserDto,
      defaultPasswordSalt,
    );

    // Create a Language in DB (if is does not already exist) as project language
    const insertedLanguage = await prismaService.language.upsert({
      where: { code: LanguageCode.EN },
      update: {},
      create: {
        code: LanguageCode.EN,
        name: LanguageName.English,
      },
    });

    // Create a Project in DB and return it
    const createdProject = prismaService.project.create({
      data: {
        founderId: insertedUser.id,
        title: 'fakeTitle',
        technicalLabels: {
          create: ['NestJS', 'JavaScript', 'Jest'].map((technicalLabel) => {
            return {
              label: {
                connect: {
                  name: technicalLabel,
                },
              },
            };
          }),
        },
        domainLabels: {
          create: ['Cooking', 'Design', 'Geography'].map((domainLabel) => {
            return {
              label: {
                connect: {
                  name: domainLabel,
                },
              },
            };
          }),
        },
        goal: Goal.Education,
        status: ProjectStatus.InProgress,
        languageCode: insertedLanguage.code,
        createdAt: new Date('2000-01-01'),
        lastUpdatedAt: new Date('2000-01-01'),
      },
    });

    return createdProject;
  }

  defaultProjectResponseDto: ProjectResponseDto = {
    id: 0,
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

  defaultProject: Project = {
    id: 0,
    founderId: 0,
    title: 'title',
    description: 'description',
    goal: Goal.Education,
    status: ProjectStatus.InProgress,
    languageCode: LanguageCode.EN,
    milestone: new Date('2000-01-01'),
    createdAt: new Date('2000-01-01'),
    lastUpdatedAt: new Date('2000-01-01'),
  };

  defaultCreateProjectDto: CreateProjectRequestDto = {
    founderId: 0,
    title: 'title',
    description: 'description',
    technicalLabels: ['NestJS', 'JavaScript', 'Jest'],
    domainLabels: ['Cooking', 'Design', 'Geography'],
    goal: Goal.Education,
    status: ProjectStatus.InProgress,
    languageCode: LanguageCode.EN,
    milestone: new Date('2000-01-01'),
  };

  defaultUpdateProjectDto = {
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
}
