import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserModule } from '../../src/modules/user/user.module';
import { defaultCreateUserDto } from '../unit/modules/user/user.utils';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ServiceException } from '../../src/common/exception-filter/serviceException';

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

    await app.init();
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

  describe('/:id GET (Get User)', () => {
    it('should return a 200 if it returns searched user', async () => {
      // Create User in DB
      const { body } = await request(app.getHttpServer())
        .post('/')
        .send(defaultCreateUserDto)
        .expect(201);

      return request(app.getHttpServer())
        .get(`/${body.id}`)
        .send(defaultCreateUserDto)
        .expect(200);
    });

    it('should return a 404 if userID does not exist', async () => {
      // Create User in DB
      const { body } = await request(app.getHttpServer())
        .post('/')
        .send(defaultCreateUserDto)
        .expect(201);

      // request user that does not exist
      return request(app.getHttpServer())
        .get(`/${body.id + 1}`)
        .expect(404);
    });

    it('should return a 400 if userID is not number', async () => {
      // userid is not a numbere
      return request(app.getHttpServer()).get(`/abc`).expect(400);
    });
  });
});
