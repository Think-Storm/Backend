jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AwsS3Module } from '../../src/modules/aws-s3/aws-s3.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ServiceException } from '../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../src/common/enums/errorMessages';
import refreshDatabase from '../../src/prisma/prisma.dbreset';
import prisma from '../../src/prisma/prisma.client';
import { defaultCreateUserDto } from '../utils/user.utils';

describe('/presigned', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AwsS3Module, AuthModule, PrismaModule.forTest(prisma)],
    }).compile();

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

  beforeEach(() => {
    (getSignedUrl as jest.Mock).mockResolvedValue(
      'https://signed-url.example.com',
    );
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await refreshDatabase();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await refreshDatabase();
    await app.close();
  });

  const validQuery = {
    filename: 'photo.png',
    mimetype: 'image/png',
    folder: 'avatars',
  };

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.getHttpServer())
      .get('/presigned')
      .query(validQuery)
      .expect(401);

    expect(response.body.message).toBe(errorMessages.PROTECT_ROUTES);
  });

  it('should return a presigned URL whose key is namespaced by the authenticated user id', async () => {
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
    const userId = loginResponse.body.data.id;

    const response = await request(app.getHttpServer())
      .get('/presigned')
      .set('Authorization', token)
      .query(validQuery)
      .expect(200);

    expect(response.body.key).toBe(`avatars/${userId}/photo.png`);
    expect(response.body.uploadUrl).toBe('https://signed-url.example.com');
  });

  it('should return 400 for a non-image mimetype', async () => {
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

    await request(app.getHttpServer())
      .get('/presigned')
      .set('Authorization', token)
      .query({ ...validQuery, mimetype: 'application/pdf' })
      .expect(400);
  });

  it('should return 400 when folder contains path traversal characters', async () => {
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

    await request(app.getHttpServer())
      .get('/presigned')
      .set('Authorization', token)
      .query({ ...validQuery, folder: '../secrets' })
      .expect(400);
  });
});
