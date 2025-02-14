import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserModule } from '../../src/modules/user/user.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ServiceException } from '../../src/common/exception-filter/serviceException';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { defaultLoginUserDto } from '../utils/auth.utils';
import { defaultCreateUserDto } from '../utils/user.utils';
import prisma from '../../src/prisma/prisma.client';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { errorMessages } from '../../src/common/enums/errorMessages';
import refreshDatabase from '../../src/prisma/prisma.dbreset';
import { AppModule } from './../../src/app.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RedisThrottlerStorageService } from '../../src/common/throttler/redisThrottlerStorage.service';

describe('/', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        AuthModule,
        UserModule,
        PrismaModule.forTest(prisma),
      ],
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

  describe('/register POST (Create User)', () => {
    it('should return a 201 if everything is fine', async () => {
      const response = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      expect(response.body.message).toBe('register success');
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.email).toBe(defaultCreateUserDto.email);
      expect(response.body.data.username).toBe(defaultCreateUserDto.username);
      expect(response.body.data.birthdate).toBe(
        defaultCreateUserDto.birthdate.toISOString(),
      );
      expect(response.body.data.fullName).toBe(defaultCreateUserDto.fullName);
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.lastUpdatedAt).toBeDefined();

      const { body: registeredUser } = await request(app.getHttpServer())
        .get(`/users/${response.body.data.id}`)
        .expect(200);
      expect(registeredUser.id).toBe(1);
      expect(registeredUser.email).toBe(defaultCreateUserDto.email);
      expect(registeredUser.username).toBe(defaultCreateUserDto.username);
      expect(registeredUser.birthdate).toBe(
        defaultCreateUserDto.birthdate.toISOString(),
      );
      expect(registeredUser.fullName).toBe(defaultCreateUserDto.fullName);
      expect(registeredUser.createdAt).toBeDefined();
      expect(registeredUser.lastUpdatedAt).toBeDefined();

      // contain bearer token and jwt token
      expect(response.headers.authorization).toContain('Bearer ');
      expect(response.headers['set-cookie'][0]).toContain('jwt=');
    });

    it('should return a 400 if user already exists', async () => {
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

      // Duplicate User that should be refused
      const { body: duplicatedRegisterUserResBody } = await request(
        app.getHttpServer(),
      )
        .post('/register')
        .send(defaultCreateUserDto);

      expect(duplicatedRegisterUserResBody.message).toBe(
        errorMessages.USER_WITH_EMAIL_ALREADY_EXISTS,
      );
    });
  });

  describe('/login POST (login)', () => {
    it('should return a 200 if everything is fine', async () => {
      // create default user
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

      const response = await request(app.getHttpServer())
        .post('/login')
        .send(defaultLoginUserDto)
        .expect(200);

      // contain bearer token and jwt token
      expect(response.headers.authorization).toContain('Bearer ');
      expect(response.headers['set-cookie'][0]).toContain('jwt=');
    });

    it('should return a 400 if email field is missing', async () => {
      await request(app.getHttpServer())
        .post('/login')
        .send({ password: defaultLoginUserDto.password })
        .expect(400)
        .expect({
          statusCode: 400,
          message: errorMessages.BAD_REQUEST_LOGIN_ERROR,
        });
    });

    it('should return a 400 if password field is missing', async () => {
      await request(app.getHttpServer())
        .post('/login')
        .send({ email: defaultLoginUserDto.email })
        .expect(400)
        .expect({
          statusCode: 400,
          message: errorMessages.BAD_REQUEST_LOGIN_ERROR,
        });
    });

    it('should return a 401 if logged in user does not exist', async () => {
      await request(app.getHttpServer())
        .post('/login')
        .send({
          email: 'nonexistuser@email.com',
          password: defaultLoginUserDto.password,
        })
        .expect(401)
        .expect({
          statusCode: 401,
          message: errorMessages.INCORRECT_EMAIL_OR_PASSWORD,
        });
    });

    it('should return a 401 if password is incorrect', async () => {
      await request(app.getHttpServer())
        .post('/login')
        .send({
          email: defaultLoginUserDto.email,
          password: 'incorrectPassword',
        })
        .expect(401)
        .expect({
          statusCode: 401,
          message: errorMessages.INCORRECT_EMAIL_OR_PASSWORD,
        });
    });
  });
});
