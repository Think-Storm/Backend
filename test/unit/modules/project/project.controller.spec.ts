import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from '../../../../src/modules/project/project.controller';
import { ProjectService } from '../../../../src/modules/project/project.service';
import { ProjectRepository } from '../../../../src/modules/project/project.repository';
import { ProjectMapper } from '../../../../src/modules/project/dtos/project.mapper';
import {
  defaultCreateProjectDto,
  defaultDeleteProjectDto,
  defaultProject,
  defaultProjectResponseDto,
  defaultSearchProjectDto,
  defaultUpdateProjectDto,
  searchProjectResponseDto,
  secondProjectResponseDto,
  defaultJoinRequestResponseDto,
} from '../../../utils/project.utils';
import { ConfigModule, ConfigService } from '@nestjs/config';
import prisma from '../../../../src/prisma/prisma.client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { UserService } from '../../../../src/modules/user/user.service';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { PasswordEncryption } from '../../../../src/common/encryption/passwordEncryption';
import { mockJwtToken } from '../../../utils/jwt.utils';
import { defaultUser, defaultUserResponseDto } from '../../../utils/user.utils';
import { createMockRequestWithUser } from '../../../utils/jwt.utils';
import { JwtAuthGuard } from '../../../../src/modules/auth/jwt/jwt.guard';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { ExecutionContext } from '@nestjs/common';
import { createAuthHeader, mockGuardContext } from '../../../utils/auth.utils';
import refreshDatabase from '../../../../src/prisma/prisma.dbreset';
import { RedisService } from '../../../../src/common/caching/redisCaching.service';
import { CacheModule } from '@nestjs/cache-manager';
import { cachingConfig } from '../../../../src/common/redis/redis.config';
import * as redisStore from 'cache-manager-ioredis';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { SaveProjectRequestDto } from '../../../../src/modules/project/dtos/saveProjectRequest.dto';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { NotificationService } from '../../../../src/modules/notification/notification.service';
import { NotificationRepository } from '../../../../src/modules/notification/notification.repository';
import { JoinRequestMapper } from '../../../../src/modules/project/dtos/joinRequest.mapper';
import { NotificationMapper } from '../../../../src/modules/notification/dtos/notification.mapper';

describe('ProjectController', () => {
  let projectController: ProjectController;
  let projectService: ProjectService;
  let prismaService: PrismaService;

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
        PrismaService,
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
        NotificationMapper,
        JoinRequestMapper,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context = mockGuardContext(defaultUserResponseDto);
          const request = context.switchToHttp().getRequest();
          request['user'] = { id: defaultUserResponseDto.id };
          return true;
        },
      })
      .compile();

    projectController = module.get<ProjectController>(ProjectController);
    projectService = module.get<ProjectService>(ProjectService);
    prismaService = module.get<PrismaService>(PrismaService);

    await prismaService.$connect();
    await refreshDatabase();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await refreshDatabase();
  });

  describe('searchProjects function', () => {
    it('should return searched project responseDtos', async () => {
      const defaultSearchedResults = [
        defaultProjectResponseDto,
        secondProjectResponseDto,
      ];

      const expectedResponse = {
        ...searchProjectResponseDto,
        projects: defaultSearchedResults,
        totalItems: 2,
      };
      // Mock service function
      const serviceSpy = jest
        .spyOn(projectService, 'searchProjects')
        .mockResolvedValue(expectedResponse);

      const response = await projectController.searchProjects(
        defaultSearchProjectDto,
      );

      expect(serviceSpy).toHaveBeenCalledTimes(1);
      expect(serviceSpy).toHaveBeenCalledWith(defaultSearchProjectDto);
      expect(response).toStrictEqual(expectedResponse);
    });
  });

  describe('getProjectById function', () => {
    it('should return a correct responseDto', async () => {
      // Mock service function
      const serviceSpy = jest
        .spyOn(projectService, 'getProjectById')
        .mockResolvedValue(defaultProjectResponseDto);

      const response = await projectController.getProjectById({
        id: defaultProjectResponseDto.id,
      });

      expect(serviceSpy).toHaveBeenCalledTimes(1);
      expect(serviceSpy).toHaveBeenCalledWith(defaultProjectResponseDto.id);
      expect(response).toBe(defaultProjectResponseDto);
    });
  });

  describe('createProject function', () => {
    it('should return a correct responseDto', async () => {
      // Mock service function
      const serviceSpy = jest
        .spyOn(projectService, 'createProject')
        .mockResolvedValue(defaultProjectResponseDto);

      const response = await projectController.createProject(
        defaultCreateProjectDto,
        { id: 1 },
      );

      expect(serviceSpy).toHaveBeenCalledTimes(1);
      expect(serviceSpy).toHaveBeenCalledWith(defaultCreateProjectDto, 1);
      expect(response).toBe(defaultProjectResponseDto);
    });

    it('should take the founderId from the authenticated user, not the body', async () => {
      const serviceSpy = jest
        .spyOn(projectService, 'createProject')
        .mockResolvedValue(defaultProjectResponseDto);

      // The body carries a foreign founderId; the controller must ignore it
      const spoofedBody = { ...defaultCreateProjectDto, founderId: 999 };
      const authenticatedUser = { id: 42 };

      await projectController.createProject(spoofedBody, authenticatedUser);

      expect(serviceSpy).toHaveBeenCalledWith(
        spoofedBody,
        authenticatedUser.id,
      );
    });
  });

  describe('updateProject function', () => {
    it('should pass correct parameters to service when authenticated', async () => {
      // Setup
      const mockRequest = createMockRequestWithUser(
        defaultUserResponseDto,
      ) as any;
      mockRequest.headers = createAuthHeader(mockJwtToken);
      mockRequest.user = { id: 1 }; // Explicitly set the user ID

      const serviceSpy = jest
        .spyOn(projectService, 'updateProject')
        .mockResolvedValue(defaultProjectResponseDto);

      // Execute
      await projectController.updateProject(
        defaultUpdateProjectDto,
        mockRequest.user, // Pass the user object directly
      );

      // Verify correct parameters are passed
      expect(serviceSpy).toHaveBeenCalledWith(
        defaultUpdateProjectDto, // Body parameter
        mockRequest.user.id, // User ID from request
      );
    });
  });

  describe('deleteProject function', () => {
    it('should pass correct parameters to service when authenticated', async () => {
      // Setup
      const mockRequest = createMockRequestWithUser(
        defaultUserResponseDto,
      ) as any;
      mockRequest.headers = createAuthHeader(mockJwtToken);
      mockRequest.user = { id: 1 }; // Explicitly set the user ID

      const serviceSpy = jest
        .spyOn(projectService, 'deleteProject')
        .mockResolvedValue(defaultProjectResponseDto);

      // Execute
      await projectController.deleteProject(
        defaultDeleteProjectDto,
        mockRequest.user, // Pass the user object directly
      );

      // Verify correct parameters are passed
      expect(serviceSpy).toHaveBeenCalledWith(
        defaultDeleteProjectDto, // Body parameter
        mockRequest.user.id, // User ID from request
      );
    });
  });

  describe('saveProject', () => {
    it('should save project successfully', async () => {
      const mockRequest = createMockRequestWithUser(
        defaultUserResponseDto,
      ) as any;
      mockRequest.headers = createAuthHeader(mockJwtToken);
      mockRequest.user = { id: defaultUser.id };

      const saveProjectDto: SaveProjectRequestDto = {
        saved_by_users: [],
      };

      const serviceSpy = jest
        .spyOn(projectService, 'saveProject')
        .mockResolvedValue(defaultProjectResponseDto);

      const result = await projectController.saveProject(
        defaultProject.id,
        saveProjectDto,
        mockRequest.user,
      );

      expect(result).toEqual(defaultProjectResponseDto);
      expect(serviceSpy).toHaveBeenCalledWith(
        defaultProject.id,
        saveProjectDto,
        mockRequest.user.id,
      );
    });

    it('should handle errors from service layer', async () => {
      const mockRequest = createMockRequestWithUser(
        defaultUserResponseDto,
      ) as any;
      mockRequest.user = { id: defaultUser.id };

      jest
        .spyOn(projectService, 'saveProject')
        .mockRejectedValue(
          ServiceException.EntityNotFoundException(
            errorMessages.ENTITY_NOT_FOUND('project', '999'),
          ),
        );

      await expect(
        projectController.saveProject(
          999,
          { saved_by_users: [] },
          mockRequest.user,
        ),
      ).rejects.toThrow(ServiceException);
    });
  });

  describe('unsaveProject', () => {
    it('should unsave saved by users in project and return project response', async () => {
      const mockRequest = createMockRequestWithUser(
        defaultUserResponseDto,
      ) as any;
      mockRequest.user = { id: 1 };
      const unsaveProjectDto: SaveProjectRequestDto = { saved_by_users: [1] };

      const serviceSpy = jest
        .spyOn(projectService, 'unsaveProject')
        .mockResolvedValue(defaultProjectResponseDto);

      const result = await projectController.unsaveProject(
        defaultProject.id,
        unsaveProjectDto,
        mockRequest.user,
      );

      expect(result).toEqual(defaultProjectResponseDto);
      expect(serviceSpy).toHaveBeenCalledWith(
        defaultProject.id,
        unsaveProjectDto,
        mockRequest.user.id,
      );
    });

    it('should handle errors from service layer', async () => {
      const mockRequest = createMockRequestWithUser(
        defaultUserResponseDto,
      ) as any;
      mockRequest.user = { id: 1 };
      const unsaveProjectDto: SaveProjectRequestDto = { saved_by_users: [1] };

      jest
        .spyOn(projectService, 'unsaveProject')
        .mockRejectedValue(
          ServiceException.EntityNotFoundException('Project not found'),
        );

      await expect(
        projectController.unsaveProject(
          defaultProject.id,
          unsaveProjectDto,
          mockRequest.user,
        ),
      ).rejects.toThrow(ServiceException);
    });
  });

  describe('createJoinRequest function', () => {
    it('should pass correct parameters to service when authenticated', async () => {
      const mockRequest = createMockRequestWithUser(
        defaultUserResponseDto,
      ) as any;
      mockRequest.headers = createAuthHeader(mockJwtToken);
      mockRequest.user = { id: 1 }; // Explicitly set the user ID

      const projectId = 1;
      const joinRequestBody = {
        roleName: 'Developer',
        message: 'I would love to contribute!',
      };

      const serviceSpy = jest
        .spyOn(projectService, 'createJoinRequest')
        .mockResolvedValue(defaultJoinRequestResponseDto);

      // Execute
      await projectController.createJoinRequest(
        projectId,
        joinRequestBody,
        mockRequest.user,
      );

      // Verify correct parameters are passed
      expect(serviceSpy).toHaveBeenCalledWith(
        mockRequest.user.id, // User ID from JWT
        projectId, // Project ID from URL parameter
        joinRequestBody, // Join Request body
      );
    });

    it('should return join request response dto', async () => {
      // Setup
      const mockRequest = createMockRequestWithUser(
        defaultUserResponseDto,
      ) as any;
      mockRequest.user = { id: 1 };

      const projectId = 1;
      const joinRequestBody = {
        roleName: 'Developer',
        message: 'I would love to contribute!',
      };

      const serviceSpy = jest
        .spyOn(projectService, 'createJoinRequest')
        .mockResolvedValue(defaultJoinRequestResponseDto);

      // Execute
      const result = await projectController.createJoinRequest(
        projectId,
        joinRequestBody,
        mockRequest.user,
      );

      // Verify response
      expect(result).toEqual(defaultJoinRequestResponseDto);
      expect(serviceSpy).toHaveBeenCalledTimes(1);
    });
  });
});
