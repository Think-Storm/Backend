import {
  Goal,
  LanguageCode,
  LanguageName,
  Project,
  Status,
} from '@prisma/client';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { defaultCreateUserDto } from '../user/user.utils';
import { defaultPasswordSalt } from '../../common/passwordEncryption.utils';
import { GetProjectResponseDto } from 'src/modules/project/dtos/getProjectResponse.dto';

export class ProjectTestUtils {
  /**
   * Creates a project in the database.
   * @param prismaService - The Prisma service for database access.
   * @param userRepository - The user repository for user-related database operations.
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
    return prismaService.project.create({
      data: {
        founderId: insertedUser.id,
        title: 'fakeTitle',
        labels: ['fakelabel', 'fakelabel2'],
        goal: Goal.Education,
        status: Status.InProgress,
        languageCode: insertedLanguage.code,
        createdAt: new Date('2000-01-01'),
        lastUpdatedAt: new Date('2000-01-01'),
      },
    });
  }

  defaultGetProjectResponseDto: GetProjectResponseDto = {
    id: 0,
    title: 'title',
    description: 'description',
    language: {
      code: LanguageCode.EN,
      name: LanguageName.English,
      createdAt: new Date('2000-01-01'),
      lastUpdatedAt: new Date('2000-01-01'),
    },
    labels: ['fakelabel', 'fakelabel2'],
    goal: Goal.Education,
    status: Status.InProgress,
    users: [],
    milestone: new Date('2000-01-01'),
    createdAt: new Date('2000-01-01'),
    lastUpdatedAt: new Date('2000-01-01'),
  };

  defaultProject: Project = {
    id: 0,
    founderId: 0,
    title: 'title',
    description: 'description',
    labels: ['fakelabel', 'fakelabel2'],
    goal: Goal.Education,
    status: Status.InProgress,
    languageCode: 'EN',
    milestone: new Date('2000-01-01'),
    createdAt: new Date('2000-01-01'),
    lastUpdatedAt: new Date('2000-01-01'),
  };
}
