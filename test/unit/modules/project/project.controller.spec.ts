import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from '../../../../src/modules/project/project.controller';
import { ProjectService } from '../../../../src/modules/project/project.service';
import { ProjectRepository } from '../../../../src/modules/project/project.repository';
import { ProjectMapper } from '../../../../src/modules/project/dtos/project.mapper';
import {
  defaultCreateProjectDto,
  defaultDeleteProjectDto,
  defaultProjectResponseDto,
  defaultSearchProjectDto,
  defaultUpdateProjectDto,
  secondProjectResponseDto,
} from '../../../utils/project.utils';
import { ConfigModule, ConfigService } from '@nestjs/config';
import prisma from '../../../../src/prisma/prisma.client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { UserService } from '../../../../src/modules/user/user.service';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { PasswordEncryption } from '../../../../src/common/encryption/passwordEncryption';
import { mockJwtToken } from '../../../utils/jwt.utils';
import { defaultUserResponseDto } from '../../../utils/user.utils';
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
      // Mock service function
      const serviceSpy = jest
        .spyOn(projectService, 'searchProjects')
        .mockResolvedValue(defaultSearchedResults);

      const response = await projectController.searchProjects(
        defaultSearchProjectDto,
      );

      expect(serviceSpy).toHaveBeenCalledTimes(1);
      expect(serviceSpy).toHaveBeenCalledWith(defaultSearchProjectDto);
      expect(response).toBe(defaultSearchedResults);
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
      );

      expect(serviceSpy).toHaveBeenCalledTimes(1);
      expect(serviceSpy).toHaveBeenCalledWith(defaultCreateProjectDto);
      expect(response).toBe(defaultProjectResponseDto);
    });
  });

  describe('updateProject function', () => {
    it('should pass correct parameters to service when authenticated', async () => {
      // Setup
      const mockRequest = createMockRequestWithUser(
        defaultUserResponseDto,
      ) as any;
      mockRequest.headers = createAuthHeader(mockJwtToken);

      const serviceSpy = jest
        .spyOn(projectService, 'updateProject')
        .mockResolvedValue(defaultProjectResponseDto);

      // Execute
      await projectController.updateProject(
        defaultUpdateProjectDto,
        mockRequest,
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

      const serviceSpy = jest
        .spyOn(projectService, 'deleteProject')
        .mockResolvedValue(defaultProjectResponseDto);

      // Execute
      await projectController.deleteProject(
        defaultDeleteProjectDto,
        mockRequest,
      );

      // Verify correct parameters are passed
      expect(serviceSpy).toHaveBeenCalledWith(
        defaultDeleteProjectDto, // Body parameter
        mockRequest.user.id, // User ID from request
      );
    });
  });
});
