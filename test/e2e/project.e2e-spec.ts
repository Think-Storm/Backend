import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ProjectTestUtils } from '../unit/modules/project/project.utils';
import { ProjectModule } from '../../src/modules/project/project.module';
import { ServiceException } from '../../src/common/exception-filter/serviceException';
import { PrismaModule } from '../../src/prisma/prisma.module';
import prisma from '../../src/prisma/prisma.client';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '../../src/modules/auth/auth.repository';
import { AuthModule } from '../../src/modules/auth/auth.module';
import refreshDatabase from '../../src/prisma/prisma.dbreset';

describe('/projects', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authRepository: AuthRepository;
  let projectTestUtils: ProjectTestUtils;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProjectModule, AuthModule, PrismaModule.forTest(prisma)],
      providers: [ProjectTestUtils, ConfigService],
    }).compile();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    projectTestUtils = moduleFixture.get<ProjectTestUtils>(ProjectTestUtils);
    authRepository = moduleFixture.get<AuthRepository>(AuthRepository);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        exceptionFactory: (errors) => {
          const errMsg = errors
            .map((error) => Object.values(error.constraints).join(''))
            .join('. ');

          return new ServiceException(`${errMsg}.`, 400, errors);
        },
        stopAtFirstError: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    await prismaService.$connect();
    await refreshDatabase();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await refreshDatabase();
  });

  describe('/ POST (Create Project)', () => {
    it('should return a 201 if everything is fine', async () => {
      // Create User and Language in DB
      const createdProject = await projectTestUtils.createProjectInDB(
        prismaService,
        authRepository,
      );

      const createProjectRequest = projectTestUtils.defaultCreateProjectDto;
      createProjectRequest.founderId = createdProject.founderId;
      createProjectRequest.languageCode = createdProject.languageCode;

      return request(app.getHttpServer())
        .post('/')
        .send(createProjectRequest)
        .expect(201);
    });

    it('should return a 404 if user is not found', async () => {
      // No previous creation of User, so the project should be refused
      return request(app.getHttpServer())
        .post('/')
        .send(projectTestUtils.defaultCreateProjectDto)
        .expect(404);
    });
  });

  describe('/:id GET (Get Project By Id)', () => {
    it('should return a 200 if everything is fine', async () => {
      // Create Project in DB
      const createdProject = await projectTestUtils.createProjectInDB(
        prismaService,
        authRepository,
      );

      // fetch Project that has be created
      return await request(app.getHttpServer())
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
