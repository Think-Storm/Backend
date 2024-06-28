import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from '../../../../src/modules/project/project.service';
import { ProjectRepository } from '../../../../src/modules/project/project.repository';
import { ProjectMapper } from '../../../../src/modules/project/dtos/project.mapper';
import { ProjectController } from '../../../../src/modules/project/project.controller';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ProjectTestUtils } from './project.utils';

describe('ProjectService', () => {
  let projectService: ProjectService;
  let projectRepository: ProjectRepository;
  let projectTestUtils: ProjectTestUtils;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        ProjectService,
        ProjectRepository,
        ProjectMapper,
        PrismaService,
        ProjectTestUtils,
      ],
    }).compile();

    projectService = module.get<ProjectService>(ProjectService);
    projectRepository = module.get<ProjectRepository>(ProjectRepository);
    projectTestUtils = module.get<ProjectTestUtils>(ProjectTestUtils);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjectById', () => {
    it('should throw an 404 exception if project with id is not found', async () => {
      // Mock call to DB not to return a Project
      const spy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(null);

      expect(
        projectService.getProjectById(
          projectTestUtils.defaultGetProjectResponseDto.id,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        projectTestUtils.defaultGetProjectResponseDto.id,
      );
    });

    it('should return a project if project exists with id', async () => {
      // Mock call to DB to return a Project
      const spy = jest
        .spyOn(projectRepository, 'findProjectById')
        .mockResolvedValue(projectTestUtils.defaultProject);

      expect(() => {
        const getProjectResponseDto = projectService.getProjectById(
          projectTestUtils.defaultGetProjectResponseDto.id,
        );

        // Checking the mapper
        expect(getProjectResponseDto).not.toHaveProperty('founderId');
      }).not.toThrow();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        projectTestUtils.defaultGetProjectResponseDto.id,
      );
    });
  });
});
