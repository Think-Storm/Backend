import { ProjectRepository } from '../../../../src/modules/project/project.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
  createProject,
  createLanguagesInDB,
  defaultCreateProjectDto,
  defaultCreateProjectRequestDto,
  defaultDeleteProjectDto,
  defaultSearchProjectDto,
  defaultSortBy,
  defaultUpdateProjectDto,
  secondCreateProjectRequestDto,
  secondSearchProjectDto,
} from '../../../utils/project.utils';
import prisma from '../../../../src/prisma/prisma.client';
import {
  defaultCreateUserDto,
  createUserInDB,
} from '../../../utils/user.utils';
import { Project } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import refreshDatabase from '../../../../src/prisma/prisma.dbreset';
import { ProjectWithRelations } from '../../../../src/modules/project/types/project.types';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { SaveProjectRequestDto } from '../../../../src/modules/project/dtos/saveProjectRequest.dto';

describe('ProjectRepository', () => {
  let prismaService: PrismaService;
  let projectRepository: ProjectRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prisma)],

      providers: [ProjectRepository, UserRepository, ConfigService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    projectRepository = module.get<ProjectRepository>(ProjectRepository);

    await prismaService.$connect();
    await refreshDatabase();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await refreshDatabase();
  });

  describe('searchProjects function', () => {
    it('should retrieve 1 searched project in DB with request queries', async () => {
      // Create a founder User
      await createUserInDB(prismaService, defaultCreateUserDto);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      // Create project with the founder user
      const createdProject = await createProject(
        prismaService,
        defaultCreateProjectRequestDto,
      );

      // Get Projects in DB
      const defaultSearchedResults = [createdProject];
      let searchedProjectsByQuery = undefined;
      try {
        searchedProjectsByQuery = await projectRepository.searchProjects(
          defaultSearchProjectDto,
          defaultSortBy,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toContain(errorMessages.ERROR_SEARCHING_PROJECTS);
      }

      expect(defaultSearchedResults).toBeDefined();
      expect({ projects: defaultSearchedResults, totalItems: 1 }).toStrictEqual(
        searchedProjectsByQuery,
      );
    });

    it('should retrieve 2 searched projects in DB with request queries', async () => {
      // Create a founder User
      await createUserInDB(prismaService, defaultCreateUserDto);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      // Create project with the founder user
      await createProject(prismaService, defaultCreateProjectRequestDto);

      const createdProject2 = await createProject(
        prismaService,
        secondCreateProjectRequestDto,
      );

      // Get Projects in DB
      const defaultSearchedResults = [createdProject2];
      let searchedProjectsByQuery = undefined;
      try {
        searchedProjectsByQuery = await projectRepository.searchProjects(
          secondSearchProjectDto,
          defaultSortBy,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toContain(errorMessages.ERROR_SEARCHING_PROJECTS);
      }

      expect(defaultSearchedResults).toBeDefined();
      expect({ projects: defaultSearchedResults, totalItems: 1 }).toStrictEqual(
        searchedProjectsByQuery,
      );
    });
  });

  describe('findProjectById function', () => {
    it('should retrieve a project in DB with id', async () => {
      // Create a founder User
      const user = await createUserInDB(prismaService, defaultCreateUserDto);

      // Add founderId to the project DTO
      const createProjectDto = {
        ...defaultCreateProjectDto,
        founderId: user.id,
      };

      // Create a founder User and Create a Project in DB
      const insertedProject = await createProject(
        prismaService,
        createProjectDto,
      );

      // Retrieve the created Project by ID
      const findProjectByIdResponse: Project | null =
        await projectRepository.findProjectById(insertedProject.id);

      expect(findProjectByIdResponse).toBeDefined();
      expect(findProjectByIdResponse.id).toBe(insertedProject.id);
    });

    it('should not retrieve a project in DB if there is no project with id', async () => {
      // Create a founder User
      const user = await createUserInDB(prismaService, defaultCreateUserDto);

      // Add founderId to the project DTO
      const createProjectDto = {
        ...defaultCreateProjectDto,
        founderId: user.id,
      };

      // Create a Project in DB
      const insertedProject = await createProject(
        prismaService,
        createProjectDto,
      );

      const findProjectByIdResponse: Project | null =
        await projectRepository.findProjectById(insertedProject.id + 1);

      expect(findProjectByIdResponse).toBeNull();
    });
  });
  describe('createProject function', () => {
    it('should create a project in DB', async () => {
      // Create a founder User
      const user = await createUserInDB(prismaService, defaultCreateUserDto);

      // Add founderId
      const createProjectDto = { ...defaultCreateProjectDto };
      createProjectDto.founderId = user.id;
      const createdProject =
        await projectRepository.createProject(createProjectDto);

      expect(createdProject).not.toBeNull();
      expect(createdProject).toHaveProperty('id');
      expect(createdProject.createdAt).toBeDefined();
      expect(createdProject.lastUpdatedAt).toBeDefined();
      expect(createdProject.founderId).toBe(createProjectDto.founderId);
      expect(createdProject.description).toBe(createProjectDto.description);
      expect(createdProject.goal).toBe(createProjectDto.goal);
      expect(createdProject.languageName).toBe(createProjectDto.languageName);
      expect(createdProject.title).toBe(createProjectDto.title);
      expect(createdProject.status).toBe(createProjectDto.status);
      expect(createdProject.milestone).toStrictEqual(
        createProjectDto.milestone,
      );
    });
  });

  describe('updateProject function', () => {
    it('should update a project in DB', async () => {
      // Create a founder User
      await createUserInDB(prismaService, defaultCreateUserDto);

      // Create a Project in DB
      await createProject(prismaService, defaultCreateProjectDto);

      // Update the Project using a domain label from seed data
      const updatedProject = (await projectRepository.updateProject(
        defaultUpdateProjectDto,
      )) as ProjectWithRelations;

      expect(updatedProject).not.toBeNull();
      expect(updatedProject).toHaveProperty('id');
      expect(updatedProject.createdAt).toBeDefined();
      expect(updatedProject.lastUpdatedAt).toBeDefined();
      expect(updatedProject.founderId).toBe(defaultUpdateProjectDto.founderId);
      expect(updatedProject.description).toBe(
        defaultUpdateProjectDto.description,
      );
      expect(updatedProject.goal).toBe(defaultUpdateProjectDto.goal);
      expect(updatedProject.language.name).toBe(
        defaultUpdateProjectDto.languageName,
      );
      expect(updatedProject.title).toBe(defaultUpdateProjectDto.title);
      expect(updatedProject.status).toBe(defaultUpdateProjectDto.status);
      expect(updatedProject.milestone).toStrictEqual(
        defaultUpdateProjectDto.milestone,
      );

      expect(updatedProject.domainLabels).toBeDefined();
      expect(updatedProject.technicalLabels).toBeDefined();
      expect(
        updatedProject.domainLabels.map((dl) => dl.labelName).sort(),
      ).toStrictEqual(defaultUpdateProjectDto.domainLabels.sort());
      expect(
        updatedProject.technicalLabels.map((tl) => tl.labelName).sort(),
      ).toStrictEqual(defaultUpdateProjectDto.technicalLabels.sort());
    });
  });

  describe('deleteProject function', () => {
    it('should delete a project in DB', async () => {
      // Create a founder User
      const createdUser = await createUserInDB(
        prismaService,
        defaultCreateUserDto,
      );

      // Create a Project in DB
      const projectTobeDeleted = (await createProject(
        prismaService,
        defaultCreateProjectDto,
      )) as ProjectWithRelations;

      // Delete the Project
      const deletedProject = (await projectRepository.deleteProjectById(
        defaultDeleteProjectDto.id,
      )) as ProjectWithRelations;

      expect(deletedProject).not.toBeNull();
      expect(deletedProject).toHaveProperty('id');
      expect(deletedProject.createdAt).toBeDefined();
      expect(deletedProject.lastUpdatedAt).toBeDefined();
      expect(deletedProject.founderId).toBe(createdUser.id);
      expect(deletedProject.description).toBe(projectTobeDeleted.description);
      expect(deletedProject.goal).toBe(projectTobeDeleted.goal);
      expect(deletedProject.language.name).toBe(
        projectTobeDeleted.languageName,
      );
      expect(deletedProject.title).toBe(projectTobeDeleted.title);
      expect(deletedProject.status).toBe(projectTobeDeleted.status);
      expect(deletedProject.milestone).toStrictEqual(
        projectTobeDeleted.milestone,
      );

      expect(deletedProject.domainLabels).toBeDefined();
      expect(deletedProject.technicalLabels).toBeDefined();
      expect(
        deletedProject.domainLabels.map((dl) => dl.labelName).sort(),
      ).toStrictEqual(
        projectTobeDeleted.domainLabels.map((dl) => dl.labelName).sort(),
      );
      expect(
        deletedProject.technicalLabels.map((tl) => tl.labelName).sort(),
      ).toStrictEqual(
        projectTobeDeleted.technicalLabels.map((dl) => dl.labelName).sort(),
      );
    });
  });

  describe('saveProject', () => {
    it('should save project successfully', async () => {
      // Create initial test data
      const user = await createUserInDB(prismaService, defaultCreateUserDto);

      const project = await createProject(
        prismaService,
        defaultCreateProjectDto,
      );

      const saveProjectDto: SaveProjectRequestDto = {
        saved_by_users: [user.id],
      };

      const savedProject = await projectRepository.saveProject(
        project.id,
        saveProjectDto,
      );

      expect(savedProject).toBeDefined();
      expect(savedProject.id).toBe(project.id);
      expect(savedProject.savedByUsers).toHaveLength(1);
      expect(savedProject.savedByUsers[0].userId).toBe(user.id);
    });

    it('should handle errors when saving project', async () => {
      const saveProjectDto: SaveProjectRequestDto = {
        saved_by_users: [999],
      };

      await expect(
        projectRepository.saveProject(999, saveProjectDto),
      ).rejects.toThrow(ServiceException);
    });
  });

  describe('unsaveProject', () => {
    it('should unsave project for given user(s)', async () => {
      // Create initial test data
      const user = await createUserInDB(prismaService, defaultCreateUserDto);
      const project = await createProject(
        prismaService,
        defaultCreateProjectDto,
      );

      // users save project fist
      await projectRepository.saveProject(project.id, {
        saved_by_users: [user.id],
      });

      // unsave test
      const unsaveProjectDto: SaveProjectRequestDto = {
        saved_by_users: [user.id],
      };

      const unsavedProject = await projectRepository.unsaveProject(
        project.id,
        unsaveProjectDto,
      );

      expect(unsavedProject).toBeDefined();
      expect(unsavedProject.id).toBe(project.id);
      expect(unsavedProject.savedByUsers).toHaveLength(0);
    });

    it('should handle errors when unsaving project', async () => {
      const unsaveProjectDto: SaveProjectRequestDto = {
        saved_by_users: [999],
      };

      await expect(
        projectRepository.unsaveProject(999, unsaveProjectDto),
      ).rejects.toThrow(ServiceException);
    });
  });

  describe('createJoinRequest', () => {
    it('should create a join request successfully', async () => {
      // Arrange
      const user = await createUserInDB(prismaService, defaultCreateUserDto);
      const project = await createProject(
        prismaService,
        defaultCreateProjectDto,
      );

      const joinRequestData = {
        userId: user.id,
        projectId: project.id,
        roleName: 'Developer',
        message: 'I want to join!',
      };

      const joinRequest = await projectRepository.createJoinRequest(
        joinRequestData.userId,
        joinRequestData.projectId,
        joinRequestData.roleName,
        joinRequestData.message,
      );

      expect(joinRequest).toBeDefined();
      expect(joinRequest.userId).toBe(user.id);
      expect(joinRequest.projectId).toBe(project.id);
      expect(joinRequest.roleName).toBe('Developer');
      expect(joinRequest.message).toBe('I want to join!');
    });

    it('should throw ServiceException on DB error', async () => {
      jest
        .spyOn(prismaService.joinRequest, 'create')
        .mockRejectedValue(new Error('DB error'));

      await expect(
        projectRepository.createJoinRequest(1, 1, 'Developer', 'msg'),
      ).rejects.toThrow(ServiceException);
    });
  });
});
