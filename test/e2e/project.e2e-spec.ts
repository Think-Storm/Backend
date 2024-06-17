import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { afterEach } from 'node:test';
import { ProjectTestUtils } from '../unit/modules/project/project.utils';
import { ProjectModule } from '../../src/modules/project/project.module';
import { UserRepository } from '../../src/modules/user/user.repository';

describe('/projects', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let userRepository: UserRepository;
  let projectTestUtils: ProjectTestUtils;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProjectModule],
      providers: [PrismaService, ProjectTestUtils, UserRepository],
    }).compile();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    projectTestUtils = moduleFixture.get<ProjectTestUtils>(ProjectTestUtils);
    userRepository = moduleFixture.get<UserRepository>(UserRepository);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
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

  describe('/:id GET (Get Project By Id)', () => {
    it('should return a 200 if everything is fine', async () => {
      // Create Project in DB
      const createdProject = await projectTestUtils.createProjectInDB(
        prismaService,
        userRepository,
      );

      // fetch Project that has be created
      return request(app.getHttpServer())
        .get(`/${createdProject.id}`)
        .expect(200);
    });

    it('should return a 404 if user does not exist', async () => {
      const fakeId = 0;
      return request(app.getHttpServer()).get(`/${fakeId}`).expect(404);
    });

    it('should return a 400 if id format is invalid', async () => {
      const invalidId = 'invalid-id';
      return request(app.getHttpServer()).get(`/${invalidId}`).expect(400);
    });
  });
});
