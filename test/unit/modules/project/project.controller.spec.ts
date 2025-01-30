import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from '../../../../src/modules/project/project.controller';
import { ProjectService } from '../../../../src/modules/project/project.service';
import { ProjectRepository } from '../../../../src/modules/project/project.repository';
import { ProjectMapper } from '../../../../src/modules/project/dtos/project.mapper';
import { ProjectTestUtils } from './project.utils';
import { ConfigService } from '@nestjs/config';
import prisma from '../../../../src/prisma/prisma.client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { UserService } from '../../../../src/modules/user/user.service';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { PasswordEncryption } from '../../../../src/common/passwordEncryption';

describe('ProjectController', () => {
  let projectController: ProjectController;
  let projectService: ProjectService;
  let projectTestUtils: ProjectTestUtils;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prisma)],
      controllers: [ProjectController],
      providers: [
        ProjectService,
        ProjectRepository,
        ProjectMapper,
        ProjectTestUtils,
        ConfigService,
        PasswordEncryption,
        UserService,
        UserRepository,
        UserMapper,
      ],
    }).compile();

    projectController = app.get<ProjectController>(ProjectController);
    projectService = app.get<ProjectService>(ProjectService);
    projectTestUtils = app.get<ProjectTestUtils>(ProjectTestUtils);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjectById function', () => {
    it('should return a correct responseDto', async () => {
      // Mock service function
      const serviceSpy = jest
        .spyOn(projectService, 'getProjectById')
        .mockResolvedValue(projectTestUtils.defaultProjectResponseDto);

      const response = await projectController.getProjectById({
        id: projectTestUtils.defaultProjectResponseDto.id,
      });

      expect(serviceSpy).toHaveBeenCalledTimes(1);
      expect(serviceSpy).toHaveBeenCalledWith(
        projectTestUtils.defaultProjectResponseDto.id,
      );
      expect(response).toBe(projectTestUtils.defaultProjectResponseDto);
    });
  });

  describe('createProject function', () => {
    it('should return a correct responseDto', async () => {
      // Mock service function
      const serviceSpy = jest
        .spyOn(projectService, 'createProject')
        .mockResolvedValue(projectTestUtils.defaultProjectResponseDto);

      const response = await projectController.createProject(
        projectTestUtils.defaultCreateProjectDto,
      );

      expect(serviceSpy).toHaveBeenCalledTimes(1);
      expect(serviceSpy).toHaveBeenCalledWith(
        projectTestUtils.defaultCreateProjectDto,
      );
      expect(response).toBe(projectTestUtils.defaultProjectResponseDto);
    });
  });
});
