import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserModule } from '../../src/modules/user/user.module';
import { defaultCreateUserDto } from '../utils/user.utils';
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
});
