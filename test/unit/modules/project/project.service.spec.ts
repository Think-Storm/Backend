import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from '../../../../src/modules/project/project.service';
import { ProjectRepository } from '../../../../src/modules/project/project.repository';
import { ProjectMapper } from '../../../../src/modules/project/dtos/project.mapper';
import { ProjectController } from '../../../../src/modules/project/project.controller';
import {
  defaultCreateProjectDto,
  defaultDeleteProjectDto,
  defaultProject,
  defaultProjectResponseDto,
  defaultSearchProjectDto,
  defaultUpdateProjectDto,
  secondProject,
  secondProjectResponseDto,
} from '../../../utils/project.utils';
import prisma from '../../../../src/prisma/prisma.client';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { UserService } from '../../../../src/modules/user/user.service';
import { defaultUser } from '../../../utils/user.utils';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { PasswordEncryption } from '../../../../src/common/encryption/passwordEncryption';
import { LanguageName } from '@prisma/client';
import { ProjectResponseDto } from '../../../../src/modules/project/dtos/projectResponse.dto';
import { RedisService } from '../../../../src/common/caching/redisCaching.service';
import { CacheModule } from '@nestjs/cache-manager';
import { cachingConfig } from '../../../../src/common/redis/redis.config';
import * as redisStore from 'cache-manager-ioredis';

describe('ProjectService', () => {
  let projectService: ProjectService;
  let projectRepository: ProjectRepository;
  let projectMapper: ProjectMapper;
  let userService: UserService;
  let redisService: RedisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        PrismaModule.forTest(prisma),
        CacheModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
            store: redisStore,
            ...cachingConfig(config),
          }),
          inject: [ConfigService],
        }),
      ],
      controllers: [ProjectController],
      providers: [
        ProjectService,
        ProjectRepository,
        ProjectMapper,
        ConfigService,
        PasswordEncryption,
        UserService,
        UserRepository,
        UserMapper,
        RedisService,
      ],
    }).compile();

    projectService = module.get<ProjectService>(ProjectService);
    projectRepository = module.get<ProjectRepository>(ProjectRepository);
    projectMapper = module.get<ProjectMapper>(ProjectMapper);
    userService = module.get<UserService>(UserService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await redisService.flushDb();
  });

  afterAll(async () => {
    await redisService.flushDb();
  });

  describe('searchProjects', () => {
    it('should return a right project if searched projects with the queries exist', async () => {
      const defaultSearchedResults: ProjectResponseDto[] = [
        defaultProjectResponseDto,
      ];
      // Mock call to DB to return Projects
      const spy = jest
        .spyOn(projectRepository, 'searchProjects')
        .mockResolvedValue([defaultProject]);

      // Mock call to project mapper to return ProjectResponseDtos
      const transformToDtoSpy = jest
        .spyOn(projectMapper, 'projectsToProjectResponseDtos')
        .mockReturnValue([defaultProjectResponseDto]);

      const searchedProjects = await projectService.searchProjects(
        defaultSearchProjectDto,
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(defaultSearchProjectDto, []);
      expect(transformToDtoSpy).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line prettier/prettier
      expect(transformToDtoSpy).toHaveBeenCalledWith([defaultProject]);
      expect(searchedProjects).toStrictEqual(defaultSearchedResults);
    });

    it('should return right projects if searched projects with the queries exist', async () => {
      const defaultSearchedResults: ProjectResponseDto[] = [
        defaultProjectResponseDto,
        secondProjectResponseDto,
      ];
      // Mock call to DB to return Projects
      const spy = jest
        .spyOn(projectRepository, 'searchProjects')
        .mockResolvedValue([defaultProject, secondProject]);

      // Mock call to project mapper to return ProjectResponseDtos
      const transformToDtoSpy = jest
        .spyOn(projectMapper, 'projectsToProjectResponseDtos')
        .mockReturnValue([defaultProjectResponseDto, secondProjectResponseDto]);

      const bothSearchProjectQuery = defaultSearchProjectDto;
      bothSearchProjectQuery.technicalLabels = 'AWS,NestJS';
      bothSearchProjectQuery.domainLabels = undefined;
      bothSearchProjectQuery.title = undefined;
      bothSearchProjectQuery.languageCode = undefined;
      bothSearchProjectQuery.description = undefined;
      bothSearchProjectQuery.status = undefined;
      bothSearchProjectQuery.goal = undefined;
      bothSearchProjectQuery.page = 1;
      bothSearchProjectQuery.limit = 10;

      const searchedProjects = await projectService.searchProjects(
        bothSearchProjectQuery,
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(defaultSearchProjectDto, []);
      expect(transformToDtoSpy).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line prettier/prettier
      expect(transformToDtoSpy).toHaveBeenCalledWith([defaultProject, secondProject]);
      expect(searchedProjects).toStrictEqual(defaultSearchedResults);
    });
  });

  describe('getProjectById', () => {
    it('should throw an 404 exception if project with id is not found', async () => {
      // Mock call to DB not to return a Project
      const spy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(null);

      try {
        await projectService.getProjectById(defaultProjectResponseDto.id);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toContain(
          errorMessages.ENTITY_NOT_FOUND(
            'Project',
            defaultProjectResponseDto.id.toString(),
          ),
        );
      }

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(defaultProjectResponseDto.id);
    });

    it('should return a project if project exists with id', async () => {
      // Mock call to DB to return a Project
      const spy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(defaultProject);

      expect(() => {
        const getProjectResponseDto = projectService.getProjectById(
          defaultProjectResponseDto.id,
        );

        // Checking the mapper
        expect(getProjectResponseDto).not.toHaveProperty('founderId');
      }).not.toThrow();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(defaultProjectResponseDto.id);
    });
  });

  describe('createProject', () => {
    it('should create user and map the result into UserResponseDto', async () => {
      // Mock call to the password and salt creation
      const userSpy = jest
        .spyOn(userService, 'getUserById')
        .mockResolvedValue(defaultUser);

      // Mock call to DB
      const dbSpy = jest
        .spyOn(projectRepository, 'createProject')
        .mockResolvedValue(defaultProject);

      const expectedResponseDto = defaultProjectResponseDto;
      expectedResponseDto.founder = undefined;
      expectedResponseDto.language = undefined;
      expectedResponseDto.users = undefined;
      expectedResponseDto.technicalLabels = undefined;
      expectedResponseDto.domainLabels = undefined;

      const projectResponseDto = await projectService.createProject(
        defaultCreateProjectDto,
      );

      // Checking the mapper
      expect(projectResponseDto).toEqual(expectedResponseDto);

      expect(userSpy).toHaveBeenCalledTimes(1);

      expect(dbSpy).toHaveBeenCalledTimes(1);
      expect(dbSpy).toHaveBeenCalledWith(defaultCreateProjectDto);
    });
  });

  describe('updateProject', () => {
    it('should throw an 404 exception if project with id is not found', async () => {
      // Mock call to DB not to return a Project
      const spy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(null);

      try {
        await projectService.updateProject(
          defaultUpdateProjectDto,
          defaultUser.id,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toContain(
          errorMessages.ENTITY_NOT_FOUND(
            'Project',
            defaultUpdateProjectDto.id.toString(),
          ),
        );
      }

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(defaultUpdateProjectDto.id);
    });

    it('should throw an 403 exception if the user is not the owner of the project', async () => {
      // Mock call to DB to return a Project
      const spy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(defaultProject);

      try {
        await projectService.updateProject(defaultUpdateProjectDto, 999);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toContain(
          errorMessages.FORBIDDEN('You are not the owner of this project'),
        );
      }

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(defaultUpdateProjectDto.id);
    });

    it('should update a project if the user is the owner of the project', async () => {
      // Mock call to DB to return a Project
      const mockProject = {
        ...defaultProject,
        language: {
          code: defaultProject.languageCode,
          name: LanguageName.English,
          createdAt: new Date(),
          lastUpdatedAt: new Date(),
        },
        users: [],
        domainLabels: [],
        technicalLabels: [],
        founderId: defaultUpdateProjectDto.founderId,
        founder: defaultUser,
      };

      const spy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(mockProject);

      const dbSpy = jest
        .spyOn(projectRepository, 'updateProject')
        .mockResolvedValue(mockProject);

      const expectedResponseDto = {
        ...defaultProjectResponseDto,
        domainLabels: [],
        technicalLabels: [],
        users: [],
        language: {
          code: defaultProject.languageCode,
          name: LanguageName.English,
          createdAt: expect.any(Date),
          lastUpdatedAt: expect.any(Date),
        },
        founder: defaultUser,
      };

      const projectResponseDto = await projectService.updateProject(
        defaultUpdateProjectDto,
        defaultUser.id,
      );

      // Checking the mapper
      expect(projectResponseDto).toEqual(expectedResponseDto);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(defaultUpdateProjectDto.id);

      expect(dbSpy).toHaveBeenCalledTimes(1);
      expect(dbSpy).toHaveBeenCalledWith(defaultUpdateProjectDto);
    });
  });

  describe('deleteProject', () => {
    it('should throw an 404 exception if project with id is not found', async () => {
      // Mock call to DB not to return a Project
      const spy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(null);

      try {
        await projectService.deleteProject(
          defaultDeleteProjectDto,
          defaultUser.id,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toContain(
          errorMessages.ENTITY_NOT_FOUND(
            'Project',
            defaultDeleteProjectDto.id.toString(),
          ),
        );
      }

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(defaultDeleteProjectDto.id);
    });

    it('should throw an 403 exception if the user is not the owner of the project', async () => {
      // Mock call to DB to return a Project
      const spy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(defaultProject);

      try {
        await projectService.deleteProject(defaultDeleteProjectDto, 999);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toContain(
          errorMessages.FORBIDDEN('You are not the owner of this project'),
        );
      }

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(defaultDeleteProjectDto.id);
    });

    it('should delete a project if the user is the owner of the project', async () => {
      const currentDate = new Date();
      // Mock call to DB to return a Project
      const mockProject = {
        ...defaultProject,
        language: {
          code: defaultProject.languageCode,
          name: LanguageName.English,
          createdAt: currentDate,
          lastUpdatedAt: currentDate,
        },
        users: [],
        domainLabels: [],
        technicalLabels: [],
        founder: defaultUser,
      };

      const spy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(mockProject);

      const dbSpy = jest
        .spyOn(projectRepository, 'deleteProjectById')
        .mockResolvedValue(mockProject);

      const expectedResponseDto = {
        ...defaultProjectResponseDto,
        language: {
          code: defaultProject.languageCode,
          name: LanguageName.English,
          createdAt: currentDate,
          lastUpdatedAt: currentDate,
        },
        users: [],
        domainLabels: [],
        technicalLabels: [],
        founder: defaultUser,
      };

      const projectResponseDto = await projectService.deleteProject(
        defaultDeleteProjectDto,
        defaultUser.id,
      );

      // Checking the mapper
      expect(projectResponseDto).toEqual(expectedResponseDto);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(defaultDeleteProjectDto.id);

      expect(dbSpy).toHaveBeenCalledTimes(1);
      expect(dbSpy).toHaveBeenCalledWith(defaultDeleteProjectDto.id);
    });
  });
});
