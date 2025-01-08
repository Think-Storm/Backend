import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { NewsletterModule } from '../../src/modules/newsletter/newsletter.module';
import { defaultCreateNewsletterSubscriptionDto } from '../utils/newsletter.utils';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ServiceException } from '../../src/common/exception-filter/serviceException';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
import refreshDatabase from '../../src/prisma/prisma.dbreset';

describe('/newsletter-subscriptions', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  const prismaClient = new PrismaClient();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NewsletterModule, PrismaModule.forTest(prismaClient)],
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

    await app.init();
    await prismaService.$connect();
    await refreshDatabase();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  describe('/ POST (Create Newsletter Subscription)', () => {
    it('should return a 201 if everything is fine', async () => {
      return request(app.getHttpServer())
        .post('/')
        .send(defaultCreateNewsletterSubscriptionDto)
        .expect(201);
    });

    it('should return a 400 if newsletter subscription already exists', async () => {
      // Create newsletter subscription in DB
      await request(app.getHttpServer())
        .post('/')
        .send(defaultCreateNewsletterSubscriptionDto)
        .expect(201);

      // Duplicate newsletter subscription that should be refused
      return request(app.getHttpServer())
        .post('/')
        .send(defaultCreateNewsletterSubscriptionDto)
        .expect(400);
    });
  });
});
