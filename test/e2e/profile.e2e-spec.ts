import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ProfileModule } from '../../src/modules/profile/profile.module';
import { UserModule } from '../../src/modules/user/user.module';
import * as cookieParser from 'cookie-parser';
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
import { AppModule } from '../../src/app.module';
import { defaultE2ECreateProfileDto } from '../utils/profile.utils';

describe('/profiles', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ProfileModule,
        UserModule,
        AuthModule,
        PrismaModule.forTest(prisma),
      ],
      providers: [ConfigService],
    })
      .overrideProvider(ThrottlerGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideProvider(RedisThrottlerStorageService)
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn(),
      })
      .compile();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    app = moduleFixture.createNestApplication();

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

  describe('profiles/:id POST (Create User Profile)', () => {
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
        .post(`/profiles/${registerResponse.body.data.id}`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send(defaultE2ECreateProfileDto);

      expect(createProfileResponse.status).toBe(201);
      expect(createProfileResponse.body.message).toBe(
        'Create User Profile Success',
      );
      expect(createProfileResponse.body.data.userId).toBe(1);
      expect(createProfileResponse.body.data.avatar).toBe(
        defaultE2ECreateProfileDto.avatar,
      );
      expect(createProfileResponse.body.data.bio).toBe(
        defaultE2ECreateProfileDto.bio,
      );
      expect(createProfileResponse.body.data.preferedRole).toBe(
        defaultE2ECreateProfileDto.preferred_role,
      );
      expect(createProfileResponse.body.data.location).toBe(
        defaultE2ECreateProfileDto.location,
      );
      expect(createProfileResponse.body.data.website).toBe(
        defaultE2ECreateProfileDto.website,
      );

      // Test interests (domain_labels)
      expect(createProfileResponse.body.data.interests).toHaveLength(2);
      expect(createProfileResponse.body.data.interests[0].userId).toBe(1);
      expect(createProfileResponse.body.data.interests[0].labelName).toBe(
        defaultE2ECreateProfileDto.domain_labels[0],
      );
      expect(createProfileResponse.body.data.interests[1].labelName).toBe(
        defaultE2ECreateProfileDto.domain_labels[1],
      );

      // Test languages
      expect(createProfileResponse.body.data.languages).toHaveLength(2);
      createProfileResponse.body.data.languages.forEach((lang) => {
        expect(lang.userId).toBe(1);
        expect(defaultE2ECreateProfileDto.languages).toContain(
          lang.languageCode,
        );
      });

      // Test skills (technical_labels)
      expect(createProfileResponse.body.data.skills).toHaveLength(3);
      const skillNames = createProfileResponse.body.data.skills.map(
        (skill) => skill.labelName,
      );
      expect(skillNames).toEqual(
        expect.arrayContaining(defaultE2ECreateProfileDto.technical_labels),
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
        .post(`/profiles/${registerResponse.body.data.id}`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send(defaultE2ECreateProfileDto);

      // Try to create profile again
      const duplicateProfileResponse = await request(app.getHttpServer())
        .post(`/profiles/${registerResponse.body.data.id}`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send({
          ...defaultE2ECreateProfileDto,
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
        .post(`/profiles/${firstUserResponse.body.data.id}`)
        .set('Cookie', secondUserResponse.headers['set-cookie'])
        .set('Authorization', secondUserResponse.headers.authorization)
        .send(defaultE2ECreateProfileDto);

      expect(unauthorizedProfileResponse.status).toBe(403);
      expect(unauthorizedProfileResponse.body.message).toBe(
        'Forbidden. You can only create a profile for your own user account',
      );
    });
  });
});
