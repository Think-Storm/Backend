import { ProjectRepository } from '../../../../src/modules/project/project.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectTestUtils } from './project.utils';
import { defaultCreateUserDto } from '../user/user.utils';
import { defaultPasswordSalt } from '../../common/passwordEncryption.utils';
import { PrismaClient, Project } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { UserRepository } from '../../../../src/modules/user/user.repository';

describe('ProjectRepository', () => {
  let prismaService: PrismaService;
  let projectRepository: ProjectRepository;
  let userRepository: UserRepository;
  let projectTestUtils: ProjectTestUtils;
  const prismaClient = new PrismaClient();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prismaClient)],
      providers: [
        ProjectRepository,
        UserRepository,
        ProjectTestUtils,
        ConfigService,
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    projectRepository = module.get<ProjectRepository>(ProjectRepository);
    userRepository = module.get<UserRepository>(UserRepository);
    projectTestUtils = module.get<ProjectTestUtils>(ProjectTestUtils);

    await prismaService.$connect();
    await prismaService.project.deleteMany();
    await prismaService.user.deleteMany();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await prismaService.project.deleteMany();
    await prismaService.user.deleteMany();
  });

  describe('findProjectById function', () => {
    it('should retrieve a project in DB with id', async () => {
      // Create a Project in DB
      const insertedProject = await projectTestUtils.createProjectInDB(
        prismaService,
        userRepository,
      );

      // Retrieve the created Project by ID
      const findProjectByIdResponse: Project | null =
        await projectRepository.findProjectById(insertedProject.id);

      expect(findProjectByIdResponse).toBeDefined();
      expect(findProjectByIdResponse.id).toBe(insertedProject.id);
    });

    it('should not retrieve a project in DB if there is no project with id', async () => {
      // Create a Project in DB
      const insertedProject = await projectTestUtils.createProjectInDB(
        prismaService,
        userRepository,
      );

      const findProjectByIdResponse: Project | null =
        await projectRepository.findProjectById(insertedProject.id + 1);

      expect(findProjectByIdResponse).toBeNull();
    });
  });
  describe('createProject function', () => {
    it('should create a project in DB', async () => {
      // Create a founder User
      const user = await userRepository.createUser(
        defaultCreateUserDto,
        defaultPasswordSalt,
      );

      // Add founderId
      const createProjectDto = projectTestUtils.defaultCreateProjectDto;
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
      expect(createdProject.labels).toStrictEqual(createProjectDto.labels);
      expect(createdProject.languageCode).toBe(createProjectDto.languageCode);
      expect(createdProject.title).toBe(createProjectDto.title);
      expect(createdProject.status).toBe(createProjectDto.status);
      expect(createdProject.milestone).toStrictEqual(
        createProjectDto.milestone,
      );
    });
  });
});