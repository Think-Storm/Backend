import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from '../../../../src/modules/project/project.controller';
import { ProjectService } from '../../../../src/modules/project/project.service';
import { ProjectRepository } from '../../../../src/modules/project/project.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { ProjectMapper } from '../../../../src/modules/project/dtos/project.mapper';
import { ProjectTestUtils } from './project.utils';

describe('ProjectController', () => {
  let projectController: ProjectController;
  let projectService: ProjectService;
  let projectTestUtils: ProjectTestUtils;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
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
        .mockResolvedValue(projectTestUtils.defaultGetProjectResponseDto);

      const response = await projectController.getProjectById({
        id: projectTestUtils.defaultGetProjectResponseDto.id,
      });

      expect(serviceSpy).toHaveBeenCalledTimes(1);
      expect(serviceSpy).toHaveBeenCalledWith(
        projectTestUtils.defaultGetProjectResponseDto.id,
      );
      expect(response).toBe(projectTestUtils.defaultGetProjectResponseDto);
    });
  });
});
