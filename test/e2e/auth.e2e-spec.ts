import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserModule } from '../../src/modules/user/user.module';
import {
  defaultCreateUserDto,
  loginUserDto,
} from '../unit/modules/user/user.utils';
import { PrismaService } from '../../src/prisma/prisma.service';
import { afterEach } from 'node:test';
import { ServiceException } from '../../src/common/exception-filter/serviceException';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { errorMessages } from '../../src/common/enums/errorMessages';

describe('/', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  const prismaClient = new PrismaClient();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, UserModule, PrismaModule.forTest(prismaClient)],
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
    app.use(cookieParser());

    await app.init();
    await prismaService.$connect();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  afterEach(async () => {
    await prismaService.project.deleteMany();
    await prismaService.user.deleteMany();
  });

  describe('/login POST (login)', () => {
    it('should return a 200 if everything is fine', async () => {
      // create default user
      await request(app.getHttpServer())
        .post('/')
        .send(defaultCreateUserDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/login')
        .send(loginUserDto)
        .expect(200);

      // contain bearer token and jwt token
      expect(response.headers.authorization).toContain('Bearer ');
      expect(response.headers['set-cookie'][0]).toContain('jwt=');
    });

    it('should return a 400 if email field is missing', async () => {
      await request(app.getHttpServer())
        .post('/login')
        .send({ password: loginUserDto.password })
        .expect(400)
        .expect({
          statusCode: 400,
          message: errorMessages.BAD_REQUEST_LOGIN_ERROR,
        });
    });

    it('should return a 400 if password field is missing', async () => {
      await request(app.getHttpServer())
        .post('/login')
        .send({ email: loginUserDto.email })
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
          password: loginUserDto.password,
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
        .send({ email: loginUserDto.email, password: 'incorrectPassword' })
        .expect(401)
        .expect({
          statusCode: 401,
          message: errorMessages.INCORRECT_EMAIL_OR_PASSWORD,
        });
    });
  });
});
