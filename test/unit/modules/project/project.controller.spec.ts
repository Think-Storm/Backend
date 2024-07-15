import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from '../../../../src/modules/project/project.controller';
import { ProjectService } from '../../../../src/modules/project/project.service';
import { ProjectRepository } from '../../../../src/modules/project/project.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { ProjectMapper } from '../../../../src/modules/project/dtos/project.mapper';
import { ProjectTestUtils } from './project.utils';
import { UserModule } from '../../../../src/modules/user/user.module';

describe('ProjectController', () => {
  let projectController: ProjectController;
  let projectService: ProjectService;
  let projectTestUtils: ProjectTestUtils;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
      controllers: [ProjectController],
      providers: [
        ProjectService,
        ProjectRepository,
        PrismaService,
        ProjectMapper,
        ProjectTestUtils,
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
