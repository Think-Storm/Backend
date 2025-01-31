import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from '../../../../src/modules/project/project.controller';
import { ProjectService } from '../../../../src/modules/project/project.service';
import { ProjectRepository } from '../../../../src/modules/project/project.repository';
import { ProjectMapper } from '../../../../src/modules/project/dtos/project.mapper';
import {
  defaultCreateProjectDto,
  defaultProjectResponseDto,
  defaultUpdateProjectDto,
} from '../../../utils/project.utils';
import { ConfigService } from '@nestjs/config';
import prisma from '../../../../src/prisma/prisma.client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { UserService } from '../../../../src/modules/user/user.service';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { PasswordEncryption } from '../../../../src/common/passwordEncryption';
import { JwtService } from '@nestjs/jwt';
import { MockJwtService, mockJwtToken } from '../../../utils/jwt.utils';
import { defaultUserResponseDto } from '../../../utils/user.utils';
import { createMockRequestWithUser } from '../../../utils/jwt.utils';
import { JwtAuthGuard } from '../../../../src/modules/auth/jwt/jwt.guard';
import { PrismaService } from '../../../../src/prisma/prisma.service';

describe('ProjectController', () => {
  let projectController: ProjectController;
  let projectService: ProjectService;
  const prismaClient = new PrismaClient();

  const setupTestModule = async (guardResponse: boolean) => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prismaClient)],
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
        {
          provide: JwtService,
          useClass: MockJwtService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => guardResponse })
      .compile();

    return module;
  };

  beforeEach(async () => {
    const app = await setupTestModule(true);
    projectController = app.get<ProjectController>(ProjectController);
    projectService = app.get<ProjectService>(ProjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
});
