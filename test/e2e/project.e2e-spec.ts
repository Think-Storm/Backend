import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  createProjectInDB,
  createProjectInDBWithUser,
  defaultCreateProjectDto,
  defaultCreateProjectRequestDto,
  defaultDeleteProjectDto,
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
import { UserRepository } from '../../src/modules/user/user.repository';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RedisThrottlerStorageService } from '../../src/common/throttler/redisThrottlerStorage.service';
import { RedisService } from '../../src/common/caching/redisCaching.service';
import { LanguageCode, stringToEnum } from '@think-storm/contracts';
describe('/projects', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let userRepository: UserRepository;
  let redisService: RedisService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProjectModule, AuthModule, PrismaModule.forTest(prisma)],
      providers: [ConfigService],
    })
      .overrideProvider(ThrottlerGuard) // Override the ThrottlerGuard
      .useValue({
        canActivate: () => true, // Disable throttling by always allowing the request
      })
      .overrideProvider(RedisThrottlerStorageService) // Override the RedisThrottlerStorageService
      .useValue({
        get: jest.fn().mockResolvedValue(null), // Mock get method to always return null
        set: jest.fn(), // Mock set method
      })
      .compile();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    userRepository = moduleFixture.get<UserRepository>(UserRepository);
    redisService = moduleFixture.get<RedisService>(RedisService);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        exceptionFactory: (errors) => {
          const errMsg = errors
            .map((error) => Object.values(error.constraints).join(''))
            .filter((error) => error)
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

  afterEach(async () => {
    await redisService.flushDb();
    await refreshDatabase();
  });

  afterAll(async () => {
    await redisService.flushDb();
    await prismaService.$disconnect();
    await refreshDatabase();
    await app.close();
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
      createProjectRequest.languageCode = stringToEnum(
        createdProject.languageCode,
        LanguageCode,
      );

      return await request(app.getHttpServer())
        .post('/')
        .send(createProjectRequest)
        .expect(201);
    });

    it('should return a 404 if user is not found', async () => {
      // No previous creation of User, so the project should be refused
      return await request(app.getHttpServer())
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
      return await request(app.getHttpServer()).get(`/${fakeId}`).expect(404);
    });

    it('should return a 400 if id format is invalid', async () => {
      const invalidId = 'invalid-id';
      return await request(app.getHttpServer())
        .get(`/${invalidId}`)
        .expect(400);
    });
  });

  describe('/ PUT (Update Project)', () => {
    it('should return a 200 if everything is fine', async () => {
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
        .put('/')
        .set('Authorization', token)
        .send(validUpdateRequest)
        .expect(200);

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

      return await request(app.getHttpServer())
        .put('/')
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
      const newUserDto = {
        ...defaultCreateUserDto,
        email: 'newUser@email.com',
        password: 'newUserPassword',
      };

      await request(app.getHttpServer())
        .post('/register')
        .send(newUserDto)
        .expect(201);

      // Login with the unauthorized user
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: newUserDto.email,
          password: newUserDto.password,
        })
        .expect(200);

      // Get the token from response headers
      const token = loginResponse.headers.authorization;

      const unauthorizedUpdateRequest = {
        ...defaultUpdateProjectDto,
        id: originalProject.id,
      };

      return await request(app.getHttpServer())
        .put('/')
        .set('Authorization', token)
        .send(unauthorizedUpdateRequest)
        .expect(403);
    });
  });

  describe('/ GET (Search Projects)', () => {
    it('should return a 200 if everything is fine', async () => {
      // Create User and Language in DB
      await createProjectInDBWithUser(
        prismaService,
        userRepository,
        defaultCreateProjectRequestDto,
      );

      const searchProjectRequest = 'goal=Education&status=InProgress';

      return await request(app.getHttpServer())
        .get(`/search?${searchProjectRequest}`)
        .expect(200);
    });

    it('should return a 400 if request format is wrong', async () => {
      const searchProjectRequest = 'goal=education&status=inprogress';

      return await request(app.getHttpServer())
        .get(`/search?${searchProjectRequest}`)
        .expect(400);
    });

    it('should return a 400 if request format either one of date from and to is not requested', async () => {
      const searchProjectRequest = 'createdAtFrom=2025-02-13';

      const response = await request(app.getHttpServer())
        .get(`/search?${searchProjectRequest}`)
        .expect(400);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(
        'createdAtFrom and createdAtTo must both be provided.',
      );
    });

    it('should return a 400 if request format date from and to is reversed', async () => {
      const searchProjectRequest =
        'createdAtFrom=2025-02-13&&createdAtTo=2024-02-13';

      const response = await request(app.getHttpServer())
        .get(`/search?${searchProjectRequest}`)
        .expect(400);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(
        'createdAtFrom date should be before createdAtTo date. createdAtTo date should be after createdAtFrom date.',
      );
    });

    it('should return a 400 if request format date from and to is wrong', async () => {
      const searchProjectRequest =
        'createdAtFrom=2025-02-13s&&createdAtTo=2024-02-13';

      const response = await request(app.getHttpServer())
        .get(`/search?${searchProjectRequest}`)
        .expect(400);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('createdAtFrom must be valid date.');
    });
  });

  describe('/:id DELETE (Delete Project)', () => {
    it('should return a 200 if everything is fine', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Then create a project with that user as a founder
      const projectTobeDeleted = await createProjectInDB(
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

      const validDeleteRequest = defaultDeleteProjectDto;

      const token = loginResponse.headers.authorization;

      const domainLabelsTobeDeleted = await prismaService.projectDomainLabel
        .findMany({
          where: { projectId: projectTobeDeleted.id },
        })
        .then((labels) => labels.map((label) => label.labelName).sort());

      const technicalLabelsTobeDeleted =
        await prismaService.projectTechnicalLabel
          .findMany({
            where: { projectId: projectTobeDeleted.id },
          })
          .then((labels) => labels.map((label) => label.labelName).sort());

      const { body: deletedProject } = await request(app.getHttpServer())
        .delete(`/${validDeleteRequest.id}`)
        .set('Authorization', token)
        .expect(200);

      expect(deletedProject).not.toBeNull();
      expect(deletedProject.title).toBe(projectTobeDeleted.title);
      expect(deletedProject.description).toBe(projectTobeDeleted.description);
      expect(deletedProject.language.code).toBe(
        projectTobeDeleted.languageCode,
      );
      expect(deletedProject.founder.id).toBe(projectTobeDeleted.founderId);
      expect(deletedProject.status).toBe(projectTobeDeleted.status);
      expect(new Date(deletedProject.milestone)).toEqual(
        projectTobeDeleted.milestone,
      );
      expect(deletedProject.goal).toBe(projectTobeDeleted.goal);
      expect(deletedProject.domainLabels.sort()).toStrictEqual(
        domainLabelsTobeDeleted,
      );
      expect(deletedProject.technicalLabels.sort()).toStrictEqual(
        technicalLabelsTobeDeleted,
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
      const nonExistentProjectDeleteRequest = { ...defaultDeleteProjectDto };
      nonExistentProjectDeleteRequest.id = fakeId;

      return await request(app.getHttpServer())
        .put(`/${nonExistentProjectDeleteRequest.id}`)
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
      const newUserDto = {
        ...defaultCreateUserDto,
        email: 'newUser@email.com',
        password: 'newUserPassword',
      };

      // Create another user who will try to delete the project
      await request(app.getHttpServer())
        .post('/register')
        .send(newUserDto)
        .expect(201);

      // Login with the new user
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: newUserDto.email,
          password: newUserDto.password,
        })
        .expect(200);

      // Get the token from response headers
      const token = loginResponse.headers.authorization;

      const unauthorizedDeleteRequest = {
        ...defaultDeleteProjectDto,
        id: originalProject.id,
      };

      return await request(app.getHttpServer())
        .delete(`/${unauthorizedDeleteRequest.id}`)
        .set('Authorization', token)
        .expect(403);
    });
  });
});
