import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserModule } from '../../src/modules/user/user.module';
import { defaultCreateUserDto } from '../unit/modules/user/user.utils';
import { PrismaService } from '../../src/prisma/prisma.service';
import { afterEach } from 'node:test';

describe('/users', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
      providers: [PrismaService],
    }).compile();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    await prismaService.$connect();
    await prismaService.project.deleteMany();
    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  afterEach(async () => {
    await prismaService.project.deleteMany();
    await prismaService.user.deleteMany();
  });

  describe('/ POST (Create User)', () => {
    it('should return a 201 if everything is fine', async () => {
      return request(app.getHttpServer())
        .post('/')
        .send(defaultCreateUserDto)
        .expect(201);
    });

    it('should return a 400 if user already exists', async () => {
      // Create User in DB
      await request(app.getHttpServer())
        .post('/')
        .send(defaultCreateUserDto)
        .expect(201);

      // Duplicate User that should be refused
      return request(app.getHttpServer())
        .post('/')
        .send(defaultCreateUserDto)
        .expect(400);
    });
  });
});
