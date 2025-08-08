import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  createProject,
  defaultCreateProjectRequestDto,
  createLanguagesInDB,
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
import { ThrottlerGuard } from '@nestjs/throttler';
import { RedisThrottlerStorageService } from '../../src/common/throttler/redisThrottlerStorage.service';
import { RedisService } from '../../src/common/caching/redisCaching.service';
import { LanguageName, stringToEnum } from '@think-storm/contracts';
import { errorMessages } from '../../src/common/enums/errorMessages';

describe('/projects', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
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
      // First create a user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      // Create project with the founder user
      const createdProject = await createProject(
        prismaService,
        defaultCreateProjectRequestDto,
      );

      const createProjectRequest = defaultCreateProjectRequestDto;
      createProjectRequest.founderId = createdProject.founderId;
      createProjectRequest.languageName = stringToEnum(
        createdProject.languageName,
        LanguageName,
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
        .send(defaultCreateProjectRequestDto)
        .expect(404);
    });
  });

  describe('/:id GET (Get Project By Id)', () => {
    it('should return a 200 if everything is fine', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      // Create project with the founder user
      const createdProject = await createProject(
        prismaService,
        defaultCreateProjectRequestDto,
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

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      // Create project with the founder user
      const createdProject = await createProject(
        prismaService,
        defaultCreateProjectRequestDto,
      );

      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: defaultCreateUserDto.email,
          password: defaultCreateUserDto.password,
        })
        .expect(200);

      const validUpdateRequest = defaultUpdateProjectDto;
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
      expect(updatedProject.languageName).toBe(validUpdateRequest.languageName);
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
      // First create a user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      // Create project with the founder user
      await createProject(prismaService, defaultCreateProjectRequestDto);

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
      // First create a user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      // Create project with the founder user
      const originalProject = await createProject(
        prismaService,
        defaultCreateProjectRequestDto,
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

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      // Create project with the founder user
      const projectTobeDeleted = await createProject(
        prismaService,
        defaultCreateProjectRequestDto,
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
      // First create a user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      await createProject(prismaService, defaultCreateProjectRequestDto);

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
      // First create a user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      const originalProject = await createProject(
        prismaService,
        defaultCreateProjectRequestDto,
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

  describe('/projects/:id/save POST (Save Project)', () => {
    it('should successfully save a project', async () => {
      // Create a founder User
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      // Create a project
      const createdProject = await createProject(
        prismaService,
        defaultCreateProjectRequestDto,
      );

      // Login to get auth token
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: defaultCreateUserDto.email,
          password: defaultCreateUserDto.password,
        })
        .expect(200);

      const token = loginResponse.headers.authorization;

      // Save the project
      const response = await request(app.getHttpServer())
        .post(`/${createdProject.id}/save`)
        .set('Authorization', token)
        .send({ saved_by_users: [] })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(createdProject.id);
      expect(response.body.savedByUsers).toHaveLength(1);
      expect(response.body.savedByUsers[0].userId).toBe(
        registerResponse.body.id,
      );
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/1/save')
        .send({ saved_by_users: [] })
        .expect(401);

      expect(response.body.message).toBe(errorMessages.PROTECT_ROUTES);
    });

    it('should return 404 when project does not exist', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: defaultCreateUserDto.email,
          password: defaultCreateUserDto.password,
        })
        .expect(200);

      const token = loginResponse.headers.authorization;

      const response = await request(app.getHttpServer())
        .post('/999/save')
        .set('Authorization', token)
        .send({ saved_by_users: [] })
        .expect(404);

      expect(response.body.message).toBe(
        errorMessages.ENTITY_NOT_FOUND('Project', '999'),
      );
    });

    it('should return 400 when project is already saved by user', async () => {
      // Create a founder User
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      // Create a project
      const createdProject = await createProject(
        prismaService,
        defaultCreateProjectRequestDto,
      );

      // Login to get auth token
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: defaultCreateUserDto.email,
          password: defaultCreateUserDto.password,
        })
        .expect(200);

      const token = loginResponse.headers.authorization;

      // Save the project first time
      await request(app.getHttpServer())
        .post(`/${createdProject.id}/save`)
        .set('Authorization', token)
        .send({ saved_by_users: [registerResponse.body.data.id] })
        .expect(201);

      // Try to save again
      const response = await request(app.getHttpServer())
        .post(`/${createdProject.id}/save`)
        .set('Authorization', token)
        .send({ saved_by_users: [registerResponse.body.data.id] })
        .expect(400);

      expect(response.body.message).toContain('already saved');
    });
  });

  describe('/projects/:id/unsave PATCH (Unsave Project)', () => {
    let userId: number;
    let token: string;
    let createdProject: any;

    beforeEach(async () => {
      // Register and login user
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // register second user
      await request(app.getHttpServer())
        .post('/register')
        .send({ ...defaultCreateUserDto, email: 'user2@email.com' })
        .expect(201);

      userId = registerResponse.body.data.id;

      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: defaultCreateUserDto.email,
          password: defaultCreateUserDto.password,
        })
        .expect(200);

      token = loginResponse.headers.authorization;

      // Create project
      createdProject = await createProject(
        prismaService,
        defaultCreateProjectRequestDto,
      );

      // Save project
      await request(app.getHttpServer())
        .post(`/${createdProject.id}/save`)
        .set('Authorization', token)
        .send({ saved_by_users: [userId] })
        .expect(201);
    });

    it('should unsave project successfully', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/${createdProject.id}/unsave`)
        .set('Authorization', token)
        .send({ saved_by_users: [userId] })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(createdProject.id);
      expect(response.body.savedByUsers).toHaveLength(0);
    });

    it('should return 404 if project does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/9999/unsave')
        .set('Authorization', token)
        .send({ saved_by_users: [userId] })
        .expect(404);
    });

    it('should return 400 if user did not save the project', async () => {
      // Unsave with a user who never saved the project
      await request(app.getHttpServer())
        .patch(`/${createdProject.id}/unsave`)
        .set('Authorization', token)
        .send({ saved_by_users: [2] })
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch(`/${createdProject.id}/unsave`)
        .send({ saved_by_users: [userId] })
        .expect(401);
    });

    it('should return 400 if saved_by_users is missing or not an array', async () => {
      await request(app.getHttpServer())
        .patch(`/${createdProject.id}/unsave`)
        .set('Authorization', token)
        .send({})
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/${createdProject.id}/unsave`)
        .set('Authorization', token)
        .send({ saved_by_users: 'not-an-array' })
        .expect(400);
    });
  });

  describe('/:id/join-requests POST (Create Join Request)', () => {
    it('should return a 201 when creating a join request successfully', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      // Create a project
      const createdProject = await createProject(
        prismaService,
        defaultCreateProjectRequestDto,
      );

      // Create another user who will make the join request
      const requestUserDto = {
        ...defaultCreateUserDto,
        email: 'requester@email.com',
        password: 'requestPassword',
      };

      await request(app.getHttpServer())
        .post('/register')
        .send(requestUserDto)
        .expect(201);

      // Login with the requester user
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: requestUserDto.email,
          password: requestUserDto.password,
        })
        .expect(200);

      const token = loginResponse.headers.authorization;

      const joinRequestDto = {
        roleName: 'Developer',
        message: 'I would love to contribute to this project!',
      };

      const { body: joinRequestResponse } = await request(app.getHttpServer())
        .post(`/${createdProject.id}/join-requests`)
        .set('Authorization', token)
        .send(joinRequestDto)
        .expect(201);

      expect(joinRequestResponse).not.toBeNull();
      expect(joinRequestResponse.projectId).toBe(createdProject.id);
      expect(joinRequestResponse.roleName).toBe(joinRequestDto.roleName);
      expect(joinRequestResponse.message).toBe(joinRequestDto.message);
      expect(joinRequestResponse.status).toBe('Pending');
    });

    it('should return a 404 when project does not exist', async () => {
      // Create a user who will make the join request
      const requestUserDto = {
        ...defaultCreateUserDto,
        email: 'requester@email.com',
        password: 'requestPassword',
      };

      await request(app.getHttpServer())
        .post('/register')
        .send(requestUserDto)
        .expect(201);

      // Login with the requester user
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: requestUserDto.email,
          password: requestUserDto.password,
        })
        .expect(200);

      const token = loginResponse.headers.authorization;
      const nonExistentProjectId = 999;

      const joinRequestDto = {
        roleName: 'Developer',
        message: 'I would love to contribute!',
      };

      return await request(app.getHttpServer())
        .post(`/${nonExistentProjectId}/join-requests`)
        .set('Authorization', token)
        .send(joinRequestDto)
        .expect(404);
    });

    it('should return a 401 when user is not authenticated', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      // Create a project
      const createdProject = await createProject(
        prismaService,
        defaultCreateProjectRequestDto,
      );

      const joinRequestDto = {
        roleName: 'Developer',
        message: 'I would love to contribute!',
      };

      return await request(app.getHttpServer())
        .post(`/${createdProject.id}/join-requests`)
        .send(joinRequestDto)
        .expect(401);
    });

    it('should return a 400 when required fields are missing', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create languages for DB
      await createLanguagesInDB(prismaService);

      // Create a project
      const createdProject = await createProject(
        prismaService,
        defaultCreateProjectRequestDto,
      );

      // Create another user who will make the join request
      const requestUserDto = {
        ...defaultCreateUserDto,
        email: 'requester@email.com',
        password: 'requestPassword',
      };

      await request(app.getHttpServer())
        .post('/register')
        .send(requestUserDto)
        .expect(201);

      // Login with the requester user
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: requestUserDto.email,
          password: requestUserDto.password,
        })
        .expect(200);

      const token = loginResponse.headers.authorization;

      // Send request without required roleName field
      const invalidJoinRequestDto = {
        message: 'I would love to contribute!',
      };

      return await request(app.getHttpServer())
        .post(`/${createdProject.id}/join-requests`)
        .set('Authorization', token)
        .send(invalidJoinRequestDto)
        .expect(400);
    });
  });

  it('should return 400 if join request already exists', async () => {
    // Create a founder User
    await createUserInDB(prismaService, defaultCreateUserDto);

    // Create languages for DB
    await createLanguagesInDB(prismaService);

    // Create a project
    const createdProject = await createProject(
      prismaService,
      defaultCreateProjectRequestDto,
    );

    // Create another user who will make the join request
    const requestUserDto = {
      ...defaultCreateUserDto,
      email: 'requester@email.com',
      password: 'requestPassword',
    };

    await request(app.getHttpServer())
      .post('/register')
      .send(requestUserDto)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send({
        email: requestUserDto.email,
        password: requestUserDto.password,
      })
      .expect(200);

    const token = loginResponse.headers.authorization;

    const joinRequestDto = {
      roleName: 'Developer',
      message: 'I would love to contribute!',
    };

    // first join request (success)
    await request(app.getHttpServer())
      .post(`/${createdProject.id}/join-requests`)
      .set('Authorization', token)
      .send(joinRequestDto)
      .expect(201);

    // second join request (duplicate error)
    const response = await request(app.getHttpServer())
      .post(`/${createdProject.id}/join-requests`)
      .set('Authorization', token)
      .send(joinRequestDto)
      .expect(400);

    expect(response.body.message).toContain(
      errorMessages.USER_ALREADY_JOINED_REQUEST,
    );
  });
});
