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
  searchProjectResponseDto,
  secondProject,
  secondProjectResponseDto,
  defaultJoinRequest,
  defaultJoinRequestResponseDto,
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
import { LanguageCode, LanguageName } from '@think-storm/contracts';
import { ProjectResponseDto } from '../../../../src/modules/project/dtos/projectResponse.dto';
import { RedisService } from '../../../../src/common/caching/redisCaching.service';
import { CacheModule } from '@nestjs/cache-manager';
import { cachingConfig } from '../../../../src/common/redis/redis.config';
import * as redisStore from 'cache-manager-ioredis';
import { SaveProjectRequestDto } from '../../../../src/modules/project/dtos/saveProjectRequest.dto';
import { NotificationService } from '../../../../src/modules/notification/notification.service';
import { NotificationRepository } from '../../../../src/modules/notification/notification.repository';
import { JoinRequestMapper } from '../../../../src/modules/project/dtos/joinRequest.mapper';

describe('ProjectService', () => {
  let projectService: ProjectService;
  let projectRepository: ProjectRepository;
  let userRepository: UserRepository;
  let projectMapper: ProjectMapper;
  let userService: UserService;
  let redisService: RedisService;
  let notificationService: NotificationService;

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
        NotificationService,
        NotificationRepository,
        JoinRequestMapper,
      ],
    }).compile();

    projectService = module.get<ProjectService>(ProjectService);
    projectRepository = module.get<ProjectRepository>(ProjectRepository);
    projectMapper = module.get<ProjectMapper>(ProjectMapper);
    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    redisService = module.get<RedisService>(RedisService);
    notificationService = module.get<NotificationService>(NotificationService);
    joinRequestMapper = module.get<JoinRequestMapper>(JoinRequestMapper);
    notificationRepository = module.get<NotificationRepository>(
      NotificationRepository,
    );
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
      // Mock call to DB to return Projects
      const spy = jest
        .spyOn(projectRepository, 'searchProjects')
        .mockResolvedValue({ projects: [defaultProject], totalItems: 1 });

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
      expect(searchedProjects).toMatchObject(searchProjectResponseDto);
    });

    it('should return right projects if searched projects with the queries exist', async () => {
      const defaultSearchedResults: ProjectResponseDto[] = [
        defaultProjectResponseDto,
        secondProjectResponseDto,
      ];
      // Mock call to DB to return Projects
      const spy = jest
        .spyOn(projectRepository, 'searchProjects')
        .mockResolvedValue({
          projects: [defaultProject, secondProject],
          totalItems: 2,
        });

      // Mock call to project mapper to return ProjectResponseDtos
      const transformToDtoSpy = jest
        .spyOn(projectMapper, 'projectsToProjectResponseDtos')
        .mockReturnValue([defaultProjectResponseDto, secondProjectResponseDto]);

      const bothSearchProjectQuery = defaultSearchProjectDto;
      bothSearchProjectQuery.technicalLabels = 'aws,nestjs';
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
      expect(transformToDtoSpy).toHaveBeenCalledWith([
        defaultProject,
        secondProject,
      ]);

      const expectedResponse = {
        ...searchProjectResponseDto,
        projects: defaultSearchedResults,
        totalItems: 2,
      };

      expect(searchedProjects).toMatchObject(expectedResponse);
    });

    it('should return cached results if they exist', async () => {
      const cachedResults = searchProjectResponseDto;

      // Mock cache manager and mapper
      jest
        .spyOn(projectService['cacheManager'], 'get')
        .mockResolvedValue(cachedResults);
      jest
        .spyOn(projectMapper, 'projectsToProjectResponseDtos')
        .mockReturnValue(cachedResults.projects);

      const result = await projectService.searchProjects(
        defaultSearchProjectDto,
      );

      expect(result).toEqual(cachedResults);
      expect(projectRepository.searchProjects).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      const error = new Error('Database error');
      jest.spyOn(projectRepository, 'searchProjects').mockRejectedValue(error);

      try {
        await projectService.searchProjects(defaultSearchProjectDto);
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceException);
        expect(error.message).toContain(error.message);
      }
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
      const spy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(defaultProject);

      const result = await projectService.getProjectById(
        defaultProjectResponseDto.id,
      );

      expect(result).toBeDefined();
      expect(spy).toHaveBeenCalledWith(defaultProjectResponseDto.id);
    });
  });

  describe('createProject', () => {
    it('should create user and map the result into UserResponseDto', async () => {
      jest.spyOn(userService, 'getUserById').mockResolvedValue(defaultUser);

      jest
        .spyOn(projectRepository, 'createProject')
        .mockResolvedValue(defaultProject);

      const result = await projectService.createProject(
        defaultCreateProjectDto,
      );

      expect(result).toEqual({
        id: defaultProject.id,
        title: defaultProject.title,
        description: defaultProject.description,
        goal: defaultProject.goal,
        status: defaultProject.status,
        users: [],
        founder: defaultUser,
        language: {
          code: LanguageCode.EN,
          name: LanguageName.English,
          createdAt: expect.any(Date),
          lastUpdatedAt: expect.any(Date),
        },
        savedByUsers: [],
        domainLabels: [],
        technicalLabels: [],
        createdAt: defaultProject.createdAt,
        lastUpdatedAt: defaultProject.lastUpdatedAt,
        milestone: defaultProject.milestone,
      });
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

      const spy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(defaultProject);

      const dbSpy = jest
        .spyOn(projectRepository, 'updateProject')
        .mockResolvedValue(defaultProject);

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
        savedByUsers: [],
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
      // Mock call to DB to return a Project
      const spy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(defaultProject);

      const dbSpy = jest
        .spyOn(projectRepository, 'deleteProjectById')
        .mockResolvedValue(defaultProject);

      const expectedResponseDto = {
        ...defaultProjectResponseDto,
        language: {
          code: defaultProject.languageCode,
          name: LanguageName.English,
          createdAt: expect.any(Date),
          lastUpdatedAt: expect.any(Date),
        },
        users: [],
        domainLabels: [],
        technicalLabels: [],
        founder: defaultUser,
        savedByUsers: [],
      };

      const projectResponseDto = await projectService.deleteProject(
        defaultDeleteProjectDto,
        defaultUser.id,
      );

      // Checking the mapper
      expect(projectResponseDto).toEqual(
        expect.objectContaining({
          ...expectedResponseDto,
          createdAt: expect.any(Date),
          lastUpdatedAt: expect.any(Date),
        }),
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(defaultDeleteProjectDto.id);

      expect(dbSpy).toHaveBeenCalledTimes(1);
      expect(dbSpy).toHaveBeenCalledWith(defaultDeleteProjectDto.id);
    });
  });

  describe('saveProject', () => {
    const mockUserId = 1;

    it('should save project when project exists and user has not saved it', async () => {
      const saveProjectDto: SaveProjectRequestDto = {
        saved_by_users: [],
      };

      const findProjectSpy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(defaultProject);

      jest.spyOn(userRepository, 'getUserById').mockResolvedValue(defaultUser);

      const saveSpy = jest
        .spyOn(projectRepository, 'saveProject')
        .mockResolvedValue(defaultProject);

      const result = await projectService.saveProject(
        defaultProject.id,
        saveProjectDto,
        mockUserId,
      );

      expect(result).toBeDefined();
      expect(findProjectSpy).toHaveBeenCalledWith(defaultProject.id);
      expect(saveSpy).toHaveBeenCalledWith(defaultProject.id, {
        saved_by_users: [mockUserId],
      });
    });

    it('should throw error when project does not exist', async () => {
      jest.spyOn(projectRepository, 'findProjectById').mockResolvedValue(null);

      await expect(
        projectService.saveProject(999, { saved_by_users: [] }, mockUserId),
      ).rejects.toThrow(ServiceException);
    });

    it('should throw error when user has already saved project', async () => {
      const mockProjectWithSavedUser = {
        ...defaultProject,
        language: {
          code: defaultProject.languageCode,
          name: LanguageName.English,
          createdAt: new Date(),
          lastUpdatedAt: new Date(),
        },
        users: [],
        founder: defaultUser,
        savedByUsers: [
          {
            projectId: defaultProject.id,
            userId: mockUserId,
            savedAt: new Date(),
            user: {
              id: mockUserId,
              email: 'test@test.com',
              username: 'testuser',
              fullName: 'Test User',
              birthdate: new Date(),
              createdAt: new Date(),
              lastUpdatedAt: new Date(),
            },
          },
        ],
        domainLabels: [],
        technicalLabels: [],
        like: [],
        involvement: [],
        joinRequest: [],
      };

      jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(mockProjectWithSavedUser);

      await expect(
        projectService.saveProject(
          defaultProject.id,
          { saved_by_users: [] },
          mockUserId,
        ),
      ).rejects.toThrow(ServiceException);
    });

    it('should throw error when user in saved_by_users does not exist', async () => {
      jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(defaultProject);

      jest.spyOn(userRepository, 'getUserById').mockResolvedValue(null);

      await expect(
        projectService.saveProject(
          defaultProject.id,
          { saved_by_users: [999] },
          mockUserId,
        ),
      ).rejects.toThrow(ServiceException);
  describe.only('postProjectJoinRequest', () => {
    it('should create a join request successfully', async () => {
      // Mock findProjectById to return a project
      const findProjectSpy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(defaultProject);

      // Mock createJoinRequest to return a join request
      const createJoinRequestSpy = jest
        .spyOn(projectRepository, 'createJoinRequest')
        .mockResolvedValue(defaultJoinRequest);

      // Mock notification service
      const createNotificationSpy = jest
        .spyOn(notificationService, 'createJoinRequestNotification')
        .mockResolvedValue(undefined);

      // Mock mapper
      const mapperSpy = jest
        .spyOn(JoinRequestMapper, 'joinRequestToJoinRequestResponseDto')
        .mockReturnValue(defaultJoinRequestResponseDto);

      const result = await projectService.postProjectJoinRequest(
        defaultJoinRequest.userId,
        defaultJoinRequest.projectId,
        defaultJoinRequest.roleName,
        defaultJoinRequest.message,
      );

      expect(findProjectSpy).toHaveBeenCalledWith(defaultJoinRequest.projectId);
      expect(createJoinRequestSpy).toHaveBeenCalledWith(
        defaultJoinRequest.userId,
        defaultJoinRequest.projectId,
        defaultJoinRequest.roleName,
        defaultJoinRequest.message,
      );
      expect(createNotificationSpy).toHaveBeenCalledWith(
        defaultProject.founderId,
        defaultProject.title,
        defaultProject.id,
      );
      expect(mapperSpy).toHaveBeenCalledWith(defaultJoinRequest);
      expect(result).toEqual(defaultJoinRequestResponseDto);
    });
  });
});
