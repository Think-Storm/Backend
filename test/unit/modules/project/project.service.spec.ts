import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from '../../../../src/modules/project/project.service';
import { ProjectRepository } from '../../../../src/modules/project/project.repository';
import { ProjectMapper } from '../../../../src/modules/project/dtos/project.mapper';
import { ProjectController } from '../../../../src/modules/project/project.controller';
import {
  defaultCreateProjectDto,
  defaultProject,
  defaultProjectResponseDto,
} from '../../../utils/project.utils';
import prisma from '../../../../src/prisma/prisma.client';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { UserService } from '../../../../src/modules/user/user.service';
import { defaultUser } from '../../../utils/user.utils';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { PasswordEncryption } from '../../../../src/common/passwordEncryption';

describe('ProjectService', () => {
  let projectService: ProjectService;
  let projectRepository: ProjectRepository;
  let userService: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prisma)],
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
      ],
    }).compile();

    projectService = module.get<ProjectService>(ProjectService);
    projectRepository = module.get<ProjectRepository>(ProjectRepository);
    userService = module.get<UserService>(UserService);
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
});
