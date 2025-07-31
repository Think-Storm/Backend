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
import { errorMessages } from '../../src/common/enums/errorMessages';

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

  describe('/projects/:id/save POST (Save Project)', () => {
    it('should successfully save a project', async () => {
      // Create a user
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create a project
      const createdProject = await createProjectInDB(
        prismaService,
        defaultCreateProjectDto,
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
      // Create and login a user first
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

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
      // Create a user
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create a project
      const createdProject = await createProjectInDB(
        prismaService,
        defaultCreateProjectDto,
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
      createdProject = await createProjectInDB(
        prismaService,
        defaultCreateProjectDto,
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
      // Create project founder
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create a project
      const createdProject = await createProjectInDB(
        prismaService,
        defaultCreateProjectDto,
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
      // Create project founder
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create a project
      const createdProject = await createProjectInDB(
        prismaService,
        defaultCreateProjectDto,
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
      // Create project founder
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto)
        .expect(201);

      // Create a project
      const createdProject = await createProjectInDB(
        prismaService,
        defaultCreateProjectDto,
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
    // Create project founder
    await request(app.getHttpServer())
      .post('/register')
      .send(defaultCreateUserDto)
      .expect(201);

    // Create a project
    const createdProject = await createProjectInDB(
      prismaService,
      defaultCreateProjectDto,
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

  describe('/:projectId/join-request/:requestId PUT (Handle Join Request)', () => {
    it('should return 200 when project owner accepts a join request', async () => {
      // Create project founder
      const founderDto = {
        ...defaultCreateUserDto,
        email: 'founder@email.com',
        username: 'projectFounder',
      };
      await request(app.getHttpServer())
        .post('/register')
        .send(founderDto)
        .expect(201);

      // Login as founder to get token
      const founderLoginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: founderDto.email,
          password: founderDto.password,
        })
        .expect(200);

      const founderToken = founderLoginResponse.headers.authorization;

      // Create a project with the founder
      const createdProject = await createProjectInDB(prismaService, {
        ...defaultCreateProjectDto,
        founderId: 1, // Will be updated after registration
      });

      // Create another user who will make the join request
      const requestUserDto = {
        ...defaultCreateUserDto,
        email: 'requester@email.com',
        username: 'joinRequester',
        password: 'requestPassword',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(requestUserDto)
        .expect(201);

      const requesterId = registerResponse.body.data.id;

      // Login with the requester user
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: requestUserDto.email,
          password: requestUserDto.password,
        })
        .expect(200);

      const requesterToken = loginResponse.headers.authorization;

      const joinRequestDto = {
        roleName: 'Developer',
        message: 'I would love to contribute to this project!',
      };

      // Create join request
      await request(app.getHttpServer())
        .post(`/${createdProject.id}/join-requests`)
        .set('Authorization', requesterToken)
        .send(joinRequestDto)
        .expect(201);

      // Accept join request as project owner
      const updateJoinRequestDto = {
        status: 'Accepted',
      };

      await request(app.getHttpServer())
        .put(`/${createdProject.id}/join-request/${requesterId}`)
        .set('Authorization', founderToken)
        .send(updateJoinRequestDto)
        .expect(200);

      // Verify the join request status was updated
      const updatedJoinRequest = await prismaService.joinRequest.findUnique({
        where: {
          userId_projectId: {
            userId: requesterId,
            projectId: createdProject.id,
          },
        },
      });

      expect(updatedJoinRequest).not.toBeNull();
      expect(updatedJoinRequest.status).toBe('Accepted');

      // Verify user involvement was created
      const involvement = await prismaService.involvement.findUnique({
        where: {
          userId_projectId: {
            userId: requesterId,
            projectId: createdProject.id,
          },
        },
      });

      expect(involvement).not.toBeNull();
      expect(involvement.roleName).toBe(joinRequestDto.roleName);
    });

    it('should return 200 when project owner rejects a join request', async () => {
      // Create project founder
      const founderDto = {
        ...defaultCreateUserDto,
        email: 'founder2@email.com',
        username: 'projectFounder2',
      };
      await request(app.getHttpServer())
        .post('/register')
        .send(founderDto)
        .expect(201);

      // Login as founder to get token
      const founderLoginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: founderDto.email,
          password: founderDto.password,
        })
        .expect(200);

      const founderToken = founderLoginResponse.headers.authorization;

      // Create a project with the founder
      const createdProject = await createProjectInDB(prismaService, {
        ...defaultCreateProjectDto,
        founderId: 1, // Will be updated after registration
      });

      // Create another user who will make the join request
      const requestUserDto = {
        ...defaultCreateUserDto,
        email: 'requester2@email.com',
        username: 'joinRequester2',
        password: 'requestPassword2',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(requestUserDto)
        .expect(201);

      const requesterId = registerResponse.body.data.id;

      // Login with the requester user
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: requestUserDto.email,
          password: requestUserDto.password,
        })
        .expect(200);

      const requesterToken = loginResponse.headers.authorization;

      const joinRequestDto = {
        roleName: 'Developer',
        message: 'I would love to contribute to this project!',
      };

      // Create join request
      await request(app.getHttpServer())
        .post(`/${createdProject.id}/join-requests`)
        .set('Authorization', requesterToken)
        .send(joinRequestDto)
        .expect(201);

      // Reject join request as project owner
      const updateJoinRequestDto = {
        status: 'Rejected',
      };

      await request(app.getHttpServer())
        .put(`/${createdProject.id}/join-request/${requesterId}`)
        .set('Authorization', founderToken)
        .send(updateJoinRequestDto)
        .expect(200);

      // Verify the join request status was updated
      const updatedJoinRequest = await prismaService.joinRequest.findUnique({
        where: {
          userId_projectId: {
            userId: requesterId,
            projectId: createdProject.id,
          },
        },
      });

      expect(updatedJoinRequest).not.toBeNull();
      expect(updatedJoinRequest.status).toBe('Rejected');

      // Verify user involvement was NOT created
      const involvement = await prismaService.involvement.findUnique({
        where: {
          userId_projectId: {
            userId: requesterId,
            projectId: createdProject.id,
          },
        },
      });

      expect(involvement).toBeNull();
    });

    it('should return 404 when project does not exist', async () => {
      // Create a user who will try to handle a join request
      const userDto = {
        ...defaultCreateUserDto,
        email: 'user3@email.com',
        username: 'testUser3',
      };
      await request(app.getHttpServer())
        .post('/register')
        .send(userDto)
        .expect(201);

      // Login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: userDto.email,
          password: userDto.password,
        })
        .expect(200);

      const token = loginResponse.headers.authorization;

      const updateJoinRequestDto = {
        status: 'Accepted',
      };

      await request(app.getHttpServer())
        .put(`/999/join-request/1`) // Non-existent project ID
        .set('Authorization', token)
        .send(updateJoinRequestDto)
        .expect(404);
    });

    it('should return 403 when user is not the project owner', async () => {
      // Create project founder
      const founderDto = {
        ...defaultCreateUserDto,
        email: 'founder4@email.com',
        username: 'projectFounder4',
      };
      await request(app.getHttpServer())
        .post('/register')
        .send(founderDto)
        .expect(201);

      // Create a project with the founder
      const createdProject = await createProjectInDB(prismaService, {
        ...defaultCreateProjectDto,
        founderId: 1, // Will be updated after registration
      });

      // Create another user who is NOT the project owner
      const unauthorizedUserDto = {
        ...defaultCreateUserDto,
        email: 'unauthorized@email.com',
        username: 'unauthorizedUser',
        password: 'unauthorizedPassword',
      };

      await request(app.getHttpServer())
        .post('/register')
        .send(unauthorizedUserDto)
        .expect(201);

      // Login as unauthorized user to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: unauthorizedUserDto.email,
          password: unauthorizedUserDto.password,
        })
        .expect(200);

      const unauthorizedToken = loginResponse.headers.authorization;

      const updateJoinRequestDto = {
        status: 'Accepted',
      };

      await request(app.getHttpServer())
        .put(`/${createdProject.id}/join-request/1`)
        .set('Authorization', unauthorizedToken)
        .send(updateJoinRequestDto)
        .expect(403);
    });

    it('should return 404 when join request does not exist', async () => {
      // Create project founder
      const founderDto = {
        ...defaultCreateUserDto,
        email: 'founder5@email.com',
        username: 'projectFounder5',
      };
      await request(app.getHttpServer())
        .post('/register')
        .send(founderDto)
        .expect(201);

      // Login as founder to get token
      const founderLoginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: founderDto.email,
          password: founderDto.password,
        })
        .expect(200);

      const founderToken = founderLoginResponse.headers.authorization;

      // Create a project with the founder
      const createdProject = await createProjectInDB(prismaService, {
        ...defaultCreateProjectDto,
        founderId: 1, // Will be updated after registration
      });

      const updateJoinRequestDto = {
        status: 'Accepted',
      };

      await request(app.getHttpServer())
        .put(`/${createdProject.id}/join-request/999`) // Non-existent request ID
        .set('Authorization', founderToken)
        .send(updateJoinRequestDto)
        .expect(404);
    });

    it('should return 401 when user is not authenticated', async () => {
      const updateJoinRequestDto = {
        status: 'Accepted',
      };

      await request(app.getHttpServer())
        .put(`/1/join-request/1`)
        .send(updateJoinRequestDto)
        .expect(401);
    });

    it('should return 400 when status is missing or invalid', async () => {
      // Create project founder
      const founderDto = {
        ...defaultCreateUserDto,
        email: 'founder6@email.com',
        username: 'projectFounder6',
      };
      await request(app.getHttpServer())
        .post('/register')
        .send(founderDto)
        .expect(201);

      // Login as founder to get token
      const founderLoginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: founderDto.email,
          password: founderDto.password,
        })
        .expect(200);

      const founderToken = founderLoginResponse.headers.authorization;

      // Create a project with the founder
      const createdProject = await createProjectInDB(prismaService, {
        ...defaultCreateProjectDto,
        founderId: 1, // Will be updated after registration
      });

      // Send request without status field
      await request(app.getHttpServer())
        .put(`/${createdProject.id}/join-request/1`)
        .set('Authorization', founderToken)
        .send({})
        .expect(400);

      // Send request with invalid status
      await request(app.getHttpServer())
        .put(`/${createdProject.id}/join-request/1`)
        .set('Authorization', founderToken)
        .send({ status: 'InvalidStatus' })
        .expect(400);
    });
  });
});
