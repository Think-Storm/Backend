import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ServiceException } from '../../src/common/exception-filter/serviceException';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { defaultLoginUserDto } from '../utils/auth.utils';
import prisma from '../../src/prisma/prisma.client';
import { ConfigModule, ConfigService } from '@nestjs/config';
import refreshDatabase from '../../src/prisma/prisma.dbreset';
import { AuthModule } from '../../src/modules/auth/auth.module';
import {
  BLOCK_REQUEST_TIME,
  LOCALHOST_IP,
  RATE_LIMITING_LIMIT,
} from '../../src/common/consts';
import { defaultCreateUserDto } from '../utils/user.utils';
import { RedisThrottlerStorageService } from '../../src/common/throttler/redisThrottlerStorage.service';
import { RedisService } from '../../src/common/throttler/redisThrottler.service';
import {
  generateIp,
  shouldSkip,
} from '../../src/common/throttler/throttlerOptions';
import { Request, Response } from 'express';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ThrottlerAbusingGuard } from '../../src/common/throttler/throttlerAbusingGuard';
import { ServiceExceptionToHttpExceptionFilter } from '../../src/common/exception-filter/serviceExceptionFilter';
import { UserModule } from '../../src/modules/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ProjectModule } from '../../src/modules/project/project.module';
import { errorMessages } from '../../src/common/enums/errorMessages';

const mockExecutionContext: Partial<ExecutionContext> = {
  switchToHttp: jest.fn().mockReturnValue({
    getRequest: jest.fn().mockReturnValue({
      headers: { 'x-forwarded-for': LOCALHOST_IP },
    } as unknown as Request),
    getResponse: jest.fn().mockReturnValue({} as Response),
  }),
};

const mockThrottlerOptions = {
  limit: RATE_LIMITING_LIMIT, // Resolves limit based on context (ex. user role)
  ttl: 1000, // 1s TTL (Time-to-Live) for rate-limiting
  blockDuration: BLOCK_REQUEST_TIME * 1000, // 1 hour block duration if the limit is exceeded
  ignoreUserAgents: [/bot/i], // Ignore requests from user agents matching this pattern
  skipIf: shouldSkip, // Skip throttling for specific conditions
  //getTracker: (context: ExecutionContext) => {
  // Custom tracker for counting requests from the user (could use a database, in-memory store, etc)
  //},
  generateKey: generateIp, // Generate a key based on IP address
};

jest.setTimeout(30000);

describe('/', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let redisThrottlerStorageService: RedisThrottlerStorageService;
  let redisService: RedisService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule.register({ defaultStrategy: 'jwt', session: false }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          global: true,
          useFactory: (config: ConfigService) => ({
            secret: config.get<string>('JWT_SECRET'),
            signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') },
          }),
          inject: [ConfigService],
        }),
        ThrottlerModule.forRoot([mockThrottlerOptions]),
        UserModule,
        ProjectModule,
        AuthModule,
        RouterModule.register([
          {
            path: 'users',
            module: UserModule,
          },
          {
            path: 'projects',
            module: ProjectModule,
          },
        ]),
        PrismaModule.forTest(prisma),
      ],
      providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: ThrottlerAbusingGuard },
        RedisThrottlerStorageService,
        RedisService,
        ConfigService,
      ],
    }).compile();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    redisThrottlerStorageService =
      moduleFixture.get<RedisThrottlerStorageService>(
        RedisThrottlerStorageService,
      );
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
    app.useGlobalFilters(
      new ServiceExceptionToHttpExceptionFilter(redisThrottlerStorageService),
    );
    await app.init();
    await prismaService.$connect();
    await refreshDatabase();
  });

  afterEach(async () => {
    await redisService.flushDb();
    jest.useRealTimers();
    await redisThrottlerStorageService.delete(generateIp(mockExecutionContext));
    await refreshDatabase();
  });

  afterAll(async () => {
    await redisService.flushDb();
    jest.useRealTimers();
    await redisThrottlerStorageService.delete(generateIp(mockExecutionContext));
    await prismaService.$disconnect();
    await refreshDatabase();
    await app.close();
  });

  describe('Global Rate Limiting', () => {
    it('should allow requests within the rate limit (concurrent requests)', async () => {
      jest.useFakeTimers({
        advanceTimers: true,
      });
      //send below RATE_LIMITING_LIMIT requests
      for (let i = 0; i < RATE_LIMITING_LIMIT; i++) {
        if (i === 0) {
          // Create the default user first
          await request(app.getHttpServer())
            .post('/register')
            .send(defaultCreateUserDto);
        } else {
          const response = await request(app.getHttpServer())
            .post('/login')
            .send({
              email: defaultLoginUserDto.email,
              password: defaultLoginUserDto.password,
            });
          expect(response.status).toBe(200);
        }
        jest.advanceTimersByTime(100);
      }
    }, 15000);

    it('should return 429 after exceeding the rate limit (concurrent requests)', async () => {
      jest.useFakeTimers({
        advanceTimers: true,
      });
      // Create the default user first
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      // Send over the RATE_LIMITING_LIMIT concurrent requests
      const requests = Array.from(
        { length: RATE_LIMITING_LIMIT + 1 },
        async () =>
          await request(app.getHttpServer()).post('/login').send({
            email: defaultLoginUserDto.email,
            password: defaultLoginUserDto.password,
          }),
      );

      // Wait for all requests to finish
      const responses = await Promise.all(requests);

      // The last request should return 429 status
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.statusCode).toBe(429); // HTTP 429 Too Many Requests
      // Check the response body
      expect(lastResponse.body.statusCode).toBe(429);
      expect(lastResponse.body.status).toBe('Fail');
      expect(lastResponse.body.message).toBe(errorMessages.THROTTLER_BLOCK);
      expect(lastResponse.body.path).toBe('/login');
      expect(lastResponse.body.timestamp).toBeDefined();
      expect(lastResponse.body.stack).toBeDefined();
    }, 15000);

    it('should return Retry-After header after exceeding rate limit (concurrent requests)', async () => {
      // Create the default user first
      await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      // Send over the RATE_LIMITING_LIMIT concurrent requests
      const requests = Array.from(
        { length: RATE_LIMITING_LIMIT + 1 },
        async () =>
          await request(app.getHttpServer()).post('/login').send({
            email: defaultLoginUserDto.email,
            password: defaultLoginUserDto.password,
          }),
      );

      // Wait for all requests to finish
      const responses = await Promise.all(requests);

      // The last request should return 429 status
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.statusCode).toBe(429); // HTTP 429 Too Many Requests

      // Ensure the `Retry-After` header is present
      expect(lastResponse.headers['retry-after']).toBeDefined();
      expect(Number(lastResponse.headers['retry-after'])).toBeGreaterThan(0); // Ensure retry-after is a positive number
    }, 15000);
  });
});
