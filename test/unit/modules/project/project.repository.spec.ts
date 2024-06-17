import { ProjectRepository } from '../../../../src/modules/project/project.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { ProjectTestUtils } from './project.utils';
import { Project } from '@prisma/client';

describe('ProjectRepository', () => {
  let prismaService: PrismaService;
  let projectRepository: ProjectRepository;
  let userRepository: UserRepository;
  let projectTestUtils: ProjectTestUtils;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        ProjectRepository,
        UserRepository,
        ProjectTestUtils,
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

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  afterEach(async () => {
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
});
