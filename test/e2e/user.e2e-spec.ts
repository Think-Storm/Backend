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
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.lastUpdatedAt).toBeDefined();

      const { body: searchedUserResult } = await request(
        app.getHttpServer(),
      ).get(`/${body.data.id}`);
      expect(searchedUserResult.id).toBe(1);
      expect(searchedUserResult.email).toBe(defaultCreateUserDto.email);
      expect(searchedUserResult.username).toBe(defaultCreateUserDto.username);
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
          password: defaultCreateUserDto.password,
        });

      const cookies = registerResponse.headers['set-cookie'];
      const authHeader = registerResponse.headers.authorization;

      // Login as a second user
      await request(app.getHttpServer()).post('/login').send({
        email: defaultUpdateUser2Dto.email,
        password: defaultCreateUserDto.password,
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

  describe('/:id DELETE (Delete User)', () => {
    it('should delete the user if authenticated and owner', async () => {
      // Register user
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);
      const userId = registerResponse.body.data.id;
      const cookies = registerResponse.headers['set-cookie'];
      const authHeader = registerResponse.headers.authorization;

      // Act
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/${userId}`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader);

      // Assert
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('Delete User Success');
    });

    it('should return 403 if user tries to delete another user', async () => {
      // Register first user
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      // Register second user
      const registerResponse2 = await request(app.getHttpServer())
        .post('/register')
        .send({
          ...defaultCreateUserDto,
          email: 'another@email.com',
          username: 'anotheruser',
        });
      const cookies2 = registerResponse2.headers['set-cookie'];
      const authHeader2 = registerResponse2.headers.authorization;

      // Try to delete first user while logged in as second user
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/1`)
        .set('Cookie', cookies2)
        .set('Authorization', authHeader2);

      expect(deleteResponse.status).toBe(403);
    });

    it('should return 404 if user does not exist', async () => {
      // Register user
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);
      const cookies = registerResponse.headers['set-cookie'];
      const authHeader = registerResponse.headers.authorization;

      // Try to delete a non-existent user
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/9999`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader);

      expect(deleteResponse.status).toBe(404);
    });
  });
});
