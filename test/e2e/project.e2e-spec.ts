import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  createProjectInDB,
  defaultCreateProjectDto,
  defaultUpdateProjectDto,
} from '../utils/project.utils';
import { createUserInDB } from '../utils/user.utils';
import { defaultCreateUserDto } from '../utils/user.utils';
import { ProjectModule } from '../../src/modules/project/project.module';
import { ServiceException } from '../../src/common/exception-filter/serviceException';
import { PrismaModule } from '../../src/prisma/prisma.module';
import prisma from '../../src/prisma/prisma.client';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../../src/modules/auth/auth.module';
import refreshDatabase from '../../src/prisma/prisma.dbreset';

describe('/projects', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProjectModule, AuthModule, PrismaModule.forTest(prisma)],
      providers: [ConfigService],
    }).compile();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

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
      await createUserInDB(prismaService, defaultCreateUserDto);
      const createdProject = await createProjectInDB(
        prismaService,
        defaultCreateProjectDto,
      );

      const createProjectRequest = defaultCreateProjectDto;
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
        .send(defaultCreateProjectDto)
        .expect(404);
    });
  });

  describe('/:id GET (Get Project By Id)', () => {
    it('should return a 200 if everything is fine', async () => {
      // Create Project in DB
      await createUserInDB(prismaService, defaultCreateUserDto);
      const createdProject = await createProjectInDB(
        prismaService,
        defaultCreateProjectDto,
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

  describe('/:id PUT (Update Project)', () => {
    it('should return a 204 if everything is fine', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Then create a project with that user as founder
      const createdProject = await createProjectInDB(
        prismaService,
        defaultCreateProjectDto,
      );

      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: defaultCreateUserDto.email,
          password: defaultCreateUserDto.password,
        })
        .expect(200);

      const validUpdateRequest = { ...defaultUpdateProjectDto };
      validUpdateRequest.founderId = createdProject.founderId;

      const token = loginResponse.headers.authorization;

      await request(app.getHttpServer())
        .put(`/${createdProject.id}`)
        .set('Authorization', token)
        .send(validUpdateRequest)
        .expect(204);

      const updatedProject = await prismaService.project.findUnique({
        where: { id: createdProject.id },
      });

      const updatedDomainLabels = await prismaService.projectDomainLabel
        .findMany({
          where: { projectId: createdProject.id },
        })
        .then((labels) => labels.map((label) => label.labelName).sort());

      const updatedTechnicalLabels = await prismaService.projectTechnicalLabel
        .findMany({
          where: { projectId: createdProject.id },
        })
        .then((labels) => labels.map((label) => label.labelName).sort());

      expect(updatedProject).not.toBeNull();
      expect(updatedProject.title).toBe(validUpdateRequest.title);
      expect(updatedProject.description).toBe(validUpdateRequest.description);
      expect(updatedProject.languageCode).toBe(validUpdateRequest.languageCode);
      expect(updatedProject.founderId).toBe(validUpdateRequest.founderId);
      expect(updatedProject.status).toBe(validUpdateRequest.status);
      expect(updatedProject.milestone).toStrictEqual(
        validUpdateRequest.milestone,
      );
      expect(updatedProject.goal).toBe(validUpdateRequest.goal);
      expect(updatedDomainLabels).toStrictEqual(
        validUpdateRequest.domainLabels.sort(),
      );
      expect(updatedTechnicalLabels).toStrictEqual(
        validUpdateRequest.technicalLabels.sort(),
      );
    });

    it('should return a 404 if project does not exist', async () => {
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      await createProjectInDB(prismaService, defaultCreateProjectDto);

      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: defaultCreateUserDto.email,
          password: defaultCreateUserDto.password,
        })
        .expect(200);

      const token = loginResponse.headers.authorization;
      const fakeId = 999;
      const nonExistentProjectUpdateRequest = { ...defaultUpdateProjectDto };
      nonExistentProjectUpdateRequest.id = fakeId;

      return request(app.getHttpServer())
        .put(`/${fakeId}`)
        .send(nonExistentProjectUpdateRequest)
        .set('Authorization', token)
        .expect(404);
    });

    it('should return a 403 if user is not the owner of the project', async () => {
      // Create original project with its owner
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      const originalProject = await createProjectInDB(
        prismaService,
        defaultCreateProjectDto,
      );

      // Create another user who will try to update the project
      const newUserDto = defaultCreateUserDto;
      newUserDto.email = 'newUser@email.com';
      newUserDto.password = 'newUserPassword';
      await request(app.getHttpServer())
        .post('/register')
        .send(newUserDto)
        .expect(201);

      // Login with the unauthorized user
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: newUserDto.email,
          password: 'newUserPassword',
        })
        .expect(200);

      // Get the token from response headers
      const token = loginResponse.headers.authorization;

      const unauthorizedUpdateRequest = { ...defaultUpdateProjectDto };

      return request(app.getHttpServer())
        .put(`/${originalProject.id}`)
        .set('Authorization', token)
        .send(unauthorizedUpdateRequest)
        .expect(403);
    });
  });
});
