import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserModule } from '../../src/modules/user/user.module';
import * as cookieParser from 'cookie-parser';
import {
  defaultCreateUserDto,
  defaultUpdateUser1Dto,
  defaultUpdateUser2Dto,
} from '../utils/user.utils';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ServiceException } from '../../src/common/exception-filter/serviceException';
import prisma from '../../src/prisma/prisma.client';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
import refreshDatabase from '../../src/prisma/prisma.dbreset';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RedisThrottlerStorageService } from '../../src/common/throttler/redisThrottlerStorage.service';
import { roles } from '../../prisma/seed-data/role';

describe('/users', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserModule, AuthModule, PrismaModule.forTest(prisma)],
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
    app = moduleFixture.createNestApplication();

    // Add cookie-parser middleware
    app.use(cookieParser());

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

  beforeEach(async () => {
    // Seed roles
    for (const role of roles) {
      await prismaService.role.upsert({
        where: { name: role.name },
        update: {},
        create: { name: role.name },
      });
    }
  });

  afterEach(async () => {
    await refreshDatabase();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await refreshDatabase();
    await app.close();
  });

  describe('/:id GET (Get User)', () => {
    it('should return a 200 if it returns searched user', async () => {
      // Create User in DB
      const { body } = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      expect(body.message).toBe('register success');
      expect(body.data.id).toBe(1);
      expect(body.data.email).toBe(defaultCreateUserDto.email);
      expect(body.data.username).toBe(defaultCreateUserDto.username);
      expect(body.data.birthdate).toBe(
        defaultCreateUserDto.birthdate.toISOString(),
      );
      expect(body.data.fullName).toBe(defaultCreateUserDto.fullName);
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.lastUpdatedAt).toBeDefined();

      const { body: searchedUserResult } = await request(
        app.getHttpServer(),
      ).get(`/${body.data.id}`);
      expect(searchedUserResult.id).toBe(1);
      expect(searchedUserResult.email).toBe(defaultCreateUserDto.email);
      expect(searchedUserResult.username).toBe(defaultCreateUserDto.username);
      expect(searchedUserResult.birthdate).toBe(
        defaultCreateUserDto.birthdate.toISOString(),
      );
      expect(searchedUserResult.fullName).toBe(defaultCreateUserDto.fullName);
      expect(searchedUserResult.createdAt).toBeDefined();
      expect(searchedUserResult.lastUpdatedAt).toBeDefined();
    });

    it('should return a 404 if userID does not exist', async () => {
      const existUserId = 1;

      // request user that does not exist
      const { body } = await request(app.getHttpServer()).get(
        `/${existUserId + 1}`,
      );

      expect(body.statusCode).toBe(404);
    });

    it('should return a 400 if userID is not number', async () => {
      // userid is not a number
      const { body } = await request(app.getHttpServer()).get(`/abc`);
      expect(body.statusCode).toBe(400);
    });
  });

  describe('/ PUT (Modify User Data)', () => {
    it('should return a 200 if it successfully modify the data and return the modified user data', async () => {
      // Create User in DB
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      // Get the cookies and authorization header
      const cookies = registerResponse.headers['set-cookie'];
      const authHeader = registerResponse.headers.authorization;

      expect(registerResponse.body.message).toBe('register success');
      expect(registerResponse.body.data.id).toBe(1);
      expect(registerResponse.body.data.email).toBe(defaultCreateUserDto.email);
      expect(registerResponse.body.data.username).toBe(
        defaultCreateUserDto.username,
      );
      expect(registerResponse.body.data.birthdate).toBe(
        defaultCreateUserDto.birthdate.toISOString(),
      );
      expect(registerResponse.body.data.fullName).toBe(
        defaultCreateUserDto.fullName,
      );
      expect(registerResponse.body.data.createdAt).toBeDefined();
      expect(registerResponse.body.data.lastUpdatedAt).toBeDefined();

      const updateResponse = await request(app.getHttpServer())
        .put(`/`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send(defaultUpdateUser1Dto);

      expect(updateResponse.body.message).toBe('Update User Success');
      expect(updateResponse.body.data.id).toBe(1);
      expect(updateResponse.body.data.email).toBe(defaultUpdateUser1Dto.email);
      expect(updateResponse.body.data.username).toBe(
        defaultUpdateUser1Dto.username,
      );
      expect(updateResponse.body.data.birthdate).toBe(
        defaultUpdateUser1Dto.birthdate.toISOString(),
      );
      expect(updateResponse.body.data.fullName).toBe(
        defaultUpdateUser1Dto.fullName,
      );
      expect(updateResponse.body.data.createdAt).toBeDefined();
      expect(updateResponse.body.data.lastUpdatedAt).toBeDefined();
    });

    it('should return a 400 if email is change but the new email is used already', async () => {
      // Register first user
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      const cookies = registerResponse.headers['set-cookie'];
      const authHeader = registerResponse.headers.authorization;

      // Register second user with different email
      await request(app.getHttpServer())
        .post('/register')
        .send({
          ...defaultCreateUserDto,
          email: defaultUpdateUser2Dto.email, // Use the email we'll try to update to
          username: 'differentusername', // Need a different username too
        });

      // Try to update first user with email that's already taken
      const updateResponse = await request(app.getHttpServer())
        .put(`/`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send({
          ...defaultUpdateUser1Dto,
          email: defaultUpdateUser2Dto.email, // Use the email that's already taken
        });

      // The response should be a 400 Bad Request
      expect(updateResponse.status).toBe(400);
    });

    it('should return a 403 if user is not authorized to update the account', async () => {
      // Register first user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      // Register second user
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send({
          ...defaultCreateUserDto,
          email: defaultUpdateUser2Dto.email,
          username: defaultUpdateUser2Dto.username,
          fullName: defaultUpdateUser2Dto.fullName,
          password: defaultUpdateUser2Dto.password,
          birthdate: defaultUpdateUser2Dto.birthdate,
        });

      const cookies = registerResponse.headers['set-cookie'];
      const authHeader = registerResponse.headers.authorization;

      // Login as a second user
      await request(app.getHttpServer()).post('/login').send({
        email: defaultUpdateUser2Dto.email,
        password: defaultUpdateUser2Dto.password,
      });

      // Try to update first user when logged in as a second user
      const updateResponse = await request(app.getHttpServer())
        .put(`/`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send({
          ...defaultUpdateUser1Dto,
        });

      // The response should be a 403 Forbidden
      expect(updateResponse.status).toBe(403);
    });

    it('should return a 404 if updated user is not found', async () => {
      // Register a user to get a valid JWT
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      const cookies = registerResponse.headers['set-cookie'];
      const authHeader = registerResponse.headers.authorization;

      // Try to update a non-existent user
      const updateResponse = await request(app.getHttpServer())
        .put(`/`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send({
          ...defaultUpdateUser1Dto,
          id: 999, // Use a non-existent user ID
        });

      // The response should be a 404 Not Found
      expect(updateResponse.status).toBe(404);
    });
  });

  describe('/:id/profile POST (Create User Profile)', () => {
    it('should return a 200 if it successfully create user profile', async () => {
      // Create User in DB
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      // Get the cookies and authorization header
      const cookies = registerResponse.headers['set-cookie'];
      const authHeader = registerResponse.headers.authorization;

      expect(registerResponse.body.message).toBe('register success');
      expect(registerResponse.body.data.id).toBe(1);
      expect(registerResponse.body.data.email).toBe(defaultCreateUserDto.email);
      expect(registerResponse.body.data.username).toBe(
        defaultCreateUserDto.username,
      );
      expect(registerResponse.body.data.birthdate).toBe(
        defaultCreateUserDto.birthdate.toISOString(),
      );
      expect(registerResponse.body.data.fullName).toBe(
        defaultCreateUserDto.fullName,
      );
      expect(registerResponse.body.data.createdAt).toBeDefined();
      expect(registerResponse.body.data.lastUpdatedAt).toBeDefined();

      const createProfileResponse = await request(app.getHttpServer())
        .post(`/users/${registerResponse.body.data.id}/profile`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send({
          avatar: 'https://example.com/avatar.jpg',
          bio: 'Test bio',
          preferred_role: 'Backend Developer',
          location: 'Test Location',
          website: 'https://example.com',
          domain_labels: ['Web Development', 'Cloud Computing'],
          languages: ['EN', 'KR'],
          technical_labels: ['NestJS', 'TypeScript', 'PostgreSQL'],
        });

      expect(createProfileResponse.status).toBe(201);
      expect(createProfileResponse.body.message).toBe(
        'Create User Profile Success',
      );
      expect(createProfileResponse.body.data.userId).toBe(1);
      expect(createProfileResponse.body.data.avatar).toBe(
        'https://example.com/avatar.jpg',
      );
      expect(createProfileResponse.body.data.bio).toBe('Test bio');
      expect(createProfileResponse.body.data.preferedRole).toBe(
        'Backend Developer',
      );
      expect(createProfileResponse.body.data.location).toBe('Test Location');
      expect(createProfileResponse.body.data.website).toBe(
        'https://example.com',
      );

      // Test interests (domain_labels)
      expect(createProfileResponse.body.data.interests).toHaveLength(2);
      expect(createProfileResponse.body.data.interests[0].userId).toBe(1);
      expect(createProfileResponse.body.data.interests[0].labelName).toBe(
        'Web Development',
      );
      expect(createProfileResponse.body.data.interests[1].labelName).toBe(
        'Cloud Computing',
      );

      // Test languages
      expect(createProfileResponse.body.data.languages).toHaveLength(2);
      createProfileResponse.body.data.languages.forEach((lang) => {
        expect(lang.userId).toBe(1);
        expect(['EN', 'KR']).toContain(lang.languageCode);
      });

      // Test skills (technical_labels)
      expect(createProfileResponse.body.data.skills).toHaveLength(3);
      const skillNames = createProfileResponse.body.data.skills.map(
        (skill) => skill.labelName,
      );
      expect(skillNames).toEqual(
        expect.arrayContaining(['NestJS', 'TypeScript', 'PostgreSQL']),
      );
      createProfileResponse.body.data.skills.forEach((skill) => {
        expect(skill.userId).toBe(1);
        expect(skill.label.name).toBe(skill.labelName);
      });
    });

    it('should return 400 if profile already exists', async () => {
      // Create User in DB
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      const cookies = registerResponse.headers['set-cookie'];
      const authHeader = registerResponse.headers.authorization;

      // Create profile first time
      await request(app.getHttpServer())
        .post(`/users/${registerResponse.body.data.id}/profile`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send({
          avatar: 'https://example.com/avatar.jpg',
          bio: 'Test bio',
          preferred_role: 'Backend Developer',
          location: 'Test Location',
          website: 'https://example.com',
          domain_labels: ['Web Development'],
          languages: ['EN'],
          technical_labels: ['NestJS'],
        });

      // Try to create profile again
      const duplicateProfileResponse = await request(app.getHttpServer())
        .post(`/users/${registerResponse.body.data.id}/profile`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send({
          avatar: 'https://example.com/avatar2.jpg',
          bio: 'Another bio',
          preferred_role: 'Frontend Developer',
          location: 'Another Location',
          website: 'https://example2.com',
          domain_labels: ['Mobile Development'],
          languages: ['KR'],
          technical_labels: ['React'],
        });

      expect(duplicateProfileResponse.status).toBe(400);
      expect(duplicateProfileResponse.body.message).toBe(
        'User profile already exists. Use update endpoint instead.',
      );
    });

    it('should return 403 if trying to create profile for another user', async () => {
      // Create first user
      const firstUserResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      // Create second user
      const secondUserResponse = await request(app.getHttpServer())
        .post('/register')
        .send({
          ...defaultCreateUserDto,
          email: 'another@example.com',
          username: 'anotheruser',
        });

      // Try to create profile for first user while authenticated as second user
      const unauthorizedProfileResponse = await request(app.getHttpServer())
        .post(`/users/${firstUserResponse.body.data.id}/profile`)
        .set('Cookie', secondUserResponse.headers['set-cookie'])
        .set('Authorization', secondUserResponse.headers.authorization)
        .send({
          avatar: 'https://example.com/avatar.jpg',
          bio: 'Test bio',
          preferred_role: 'Backend Developer',
          location: 'Test Location',
          website: 'https://example.com',
          domain_labels: ['Web Development'],
          languages: ['EN'],
          technical_labels: ['NestJS'],
        });

      expect(unauthorizedProfileResponse.status).toBe(403);
      expect(unauthorizedProfileResponse.body.message).toBe(
        'Forbidden. You can only create a profile for your own user account',
      );
    });
  });
});
