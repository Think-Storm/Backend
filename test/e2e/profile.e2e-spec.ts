import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ProfileModule } from '../../src/modules/profile/profile.module';
import { UserModule } from '../../src/modules/user/user.module';
import * as cookieParser from 'cookie-parser';
import { defaultCreateUserDto } from '../utils/user.utils';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ServiceException } from '../../src/common/exception-filter/serviceException';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RedisThrottlerStorageService } from '../../src/common/throttler/redisThrottlerStorage.service';
import { defaultE2ECreateProfileDto } from '../utils/profile.utils';
import { errorMessages } from '../../src/common/enums/errorMessages';
import { UserRole, LanguageName } from '@think-storm/contracts';
import refreshDatabase from '../../src/prisma/prisma.dbreset';
import prisma from '../../src/prisma/prisma.client';
import { AppModule } from '../../src/app.module';

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
      .useValue({ canActivate: () => true })
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
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
          const messages = errors
            .map((err) => Object.values(err.constraints))
            .flat()
            .join('. ');
          return new ServiceException(messages, 400, errors);
        },
      }),
    );

    await app.init();
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
      expect(createProfileResponse.body.data.location).toBe(
        defaultE2ECreateProfileDto.location,
      );
      expect(createProfileResponse.body.data.fullName).toBe(
        defaultE2ECreateProfileDto.fullName,
      );
      expect(createProfileResponse.body.data.birthdate).toBe(
        defaultE2ECreateProfileDto.birthdate.toISOString(),
      );
      // Test websites
      expect(createProfileResponse.body.data.website[0]).toBe(
        defaultE2ECreateProfileDto.website[0],
      );
      // Test roles
      expect(createProfileResponse.body.data.preferredRole).toHaveLength(1);
      createProfileResponse.body.data.preferredRole.forEach((role) => {
        expect(role.roleName).toBe(
          defaultE2ECreateProfileDto.preferred_role[0],
        );
        expect(defaultE2ECreateProfileDto.preferred_role).toContain(
          role.roleName,
        );
      });

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
          lang.languageName,
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
          fullName: 'Full Name2',
          birthdate: new Date('2000-01-01'),
          preferred_role: [UserRole.FrontendDeveloper],
          location: 'Another Location',
          website: ['https://example1.com', 'https://example2.com'],
          domain_labels: ['Mobile Development'],
          languages: [LanguageName.Korean],
          technical_labels: ['react'],
        });

      expect(duplicateProfileResponse.status).toBe(400);
      expect(duplicateProfileResponse.body.message).toBe(
        'User profile already exists.',
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

  describe('profiles/:id GET (Get User Profile)', () => {
    it('should return 200 and profile data when profile exists', async () => {
      // Create User and Profile
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      const cookies = registerResponse.headers['set-cookie'];
      const authHeader = registerResponse.headers.authorization;

      await request(app.getHttpServer())
        .post(`/profiles/${registerResponse.body.data.id}`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send(defaultE2ECreateProfileDto);

      // Get Profile
      const getProfileResponse = await request(app.getHttpServer())
        .get(`/profiles/${registerResponse.body.data.id}`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader);

      expect(getProfileResponse.status).toBe(200);
      expect(getProfileResponse.body.message).toBe('Get User Profile Success');
      expect(getProfileResponse.body.data.userId).toBe(1);
      expect(getProfileResponse.body.data.avatar).toBe(
        defaultE2ECreateProfileDto.avatar,
      );
      expect(getProfileResponse.body.data.bio).toBe(
        defaultE2ECreateProfileDto.bio,
      );
      expect(getProfileResponse.body.data.location).toBe(
        defaultE2ECreateProfileDto.location,
      );
      expect(getProfileResponse.body.data.fullName).toBe(
        defaultE2ECreateProfileDto.fullName,
      );
      expect(getProfileResponse.body.data.birthdate).toBe(
        defaultE2ECreateProfileDto.birthdate.toISOString(),
      );

      expect(getProfileResponse.body.data.website[0]).toBe(
        defaultE2ECreateProfileDto.website[0],
      );

      // Verify associations
      expect(getProfileResponse.body.data.preferredRole[0].roleName).toBe(
        defaultE2ECreateProfileDto.preferred_role[0],
      );
      expect(getProfileResponse.body.data.interests).toHaveLength(2);
      expect(getProfileResponse.body.data.languages).toHaveLength(2);
      expect(getProfileResponse.body.data.skills).toHaveLength(3);
    });

    it('should return 403 when trying to access another user profile', async () => {
      // Create first user and profile
      const firstUserResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      await request(app.getHttpServer())
        .post(`/profiles/${firstUserResponse.body.data.id}`)
        .set('Cookie', firstUserResponse.headers['set-cookie'])
        .set('Authorization', firstUserResponse.headers.authorization)
        .send(defaultE2ECreateProfileDto);

      // Create second user
      const secondUserResponse = await request(app.getHttpServer())
        .post('/register')
        .send({
          ...defaultCreateUserDto,
          email: 'another@example.com',
          username: 'anotheruser',
        });

      // Try to get first user's profile while authenticated as second user
      const unauthorizedResponse = await request(app.getHttpServer())
        .get(`/profiles/${firstUserResponse.body.data.id}`)
        .set('Cookie', secondUserResponse.headers['set-cookie'])
        .set('Authorization', secondUserResponse.headers.authorization);

      expect(unauthorizedResponse.status).toBe(403);
      expect(unauthorizedResponse.body.message).toBe(
        'Forbidden. You can only view your own profile',
      );
    });

    it('should return 404 when profile does not exist', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      const nonExistentProfileResponse = await request(app.getHttpServer())
        .get('/profiles/999')
        .set('Cookie', registerResponse.headers['set-cookie'])
        .set('Authorization', registerResponse.headers.authorization);

      expect(nonExistentProfileResponse.status).toBe(404);
      expect(nonExistentProfileResponse.body.message).toBe(
        errorMessages.ENTITY_NOT_FOUND('Profile', '999'),
      );
    });
  });

  describe('profiles/:id PATCH (Update User Profile)', () => {
    it('should return 200 and updated profile data when update is successful', async () => {
      // Create User and Profile
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      const cookies = registerResponse.headers['set-cookie'];
      const authHeader = registerResponse.headers.authorization;

      await request(app.getHttpServer())
        .post(`/profiles/${registerResponse.body.data.id}`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send(defaultE2ECreateProfileDto);

      // Update Profile
      const updateData = {
        avatar: 'https://example.com/new-avatar.jpg',
        bio: 'Updated bio',
        preferred_role: [UserRole.FullStackDeveloper],
        location: 'New Location',
        website: ['https://example.com/new'],
        domain_labels: ['Cloud Computing', 'DevOps'],
        languages: [LanguageName.Korean, LanguageName.Japanese],
        technical_labels: ['docker', 'kubernetes'],
      };

      const updateResponse = await request(app.getHttpServer())
        .patch(`/profiles/${registerResponse.body.data.id}`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.message).toBe('Update User Profile Success');
      expect(updateResponse.body.data.avatar).toBe(updateData.avatar);
      expect(updateResponse.body.data.bio).toBe(updateData.bio);
      expect(updateResponse.body.data.location).toBe(updateData.location);
      expect(updateResponse.body.data.website[0]).toBe(updateData.website[0]);

      // Verify updated associations
      expect(updateResponse.body.data.preferredRole).toHaveLength(1);
      expect(updateResponse.body.data.preferredRole[0].roleName).toBe(
        updateData.preferred_role[0],
      );
      expect(updateResponse.body.data.interests).toHaveLength(2);
      expect(updateResponse.body.data.interests[0].labelName).toBe(
        updateData.domain_labels[0],
      );
      expect(updateResponse.body.data.languages).toHaveLength(2);
      expect(updateResponse.body.data.skills).toHaveLength(2);
    });

    it('should return 403 when trying to update another user profile', async () => {
      // Create first user and profile
      const firstUserResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      await request(app.getHttpServer())
        .post(`/profiles/${firstUserResponse.body.data.id}`)
        .set('Cookie', firstUserResponse.headers['set-cookie'])
        .set('Authorization', firstUserResponse.headers.authorization)
        .send(defaultE2ECreateProfileDto);

      // Create second user
      const secondUserResponse = await request(app.getHttpServer())
        .post('/register')
        .send({
          ...defaultCreateUserDto,
          email: 'another@example.com',
          username: 'anotheruser',
        });

      // Try to update first user's profile while authenticated as second user
      const unauthorizedResponse = await request(app.getHttpServer())
        .patch(`/profiles/${firstUserResponse.body.data.id}`)
        .set('Cookie', secondUserResponse.headers['set-cookie'])
        .set('Authorization', secondUserResponse.headers.authorization)
        .send({
          bio: 'Unauthorized update',
        });

      expect(unauthorizedResponse.status).toBe(403);
      expect(unauthorizedResponse.body.message).toBe(
        'Forbidden. You can only update your own profile',
      );
    });

    it('should return 404 when profile does not exist', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      const nonExistentProfileResponse = await request(app.getHttpServer())
        .patch('/profiles/999')
        .set('Cookie', registerResponse.headers['set-cookie'])
        .set('Authorization', registerResponse.headers.authorization)
        .send({
          bio: 'Update attempt',
        });

      expect(nonExistentProfileResponse.status).toBe(404);
      expect(nonExistentProfileResponse.body.message).toBe(
        errorMessages.ENTITY_NOT_FOUND('Profile', '999'),
      );
    });
  });

  describe('profiles/:id DELETE (Delete User Profile)', () => {
    it('should return 200 and deleted profile data when deletion is successful', async () => {
      // Create User and Profile
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      const cookies = registerResponse.headers['set-cookie'];
      const authHeader = registerResponse.headers.authorization;

      await request(app.getHttpServer())
        .post(`/profiles/${registerResponse.body.data.id}`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader)
        .send(defaultE2ECreateProfileDto);

      // Delete Profile
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/profiles/${registerResponse.body.data.id}`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('Delete User Profile Success');
      expect(deleteResponse.body.data.userId).toBe(1);

      // Verify profile is actually deleted
      const getProfileResponse = await request(app.getHttpServer())
        .get(`/profiles/${registerResponse.body.data.id}`)
        .set('Cookie', cookies)
        .set('Authorization', authHeader);

      expect(getProfileResponse.status).toBe(404);
    });

    it('should return 403 when trying to delete another user profile', async () => {
      // Create first user and profile
      const firstUserResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      await request(app.getHttpServer())
        .post(`/profiles/${firstUserResponse.body.data.id}`)
        .set('Cookie', firstUserResponse.headers['set-cookie'])
        .set('Authorization', firstUserResponse.headers.authorization)
        .send(defaultE2ECreateProfileDto);

      // Create second user
      const secondUserResponse = await request(app.getHttpServer())
        .post('/register')
        .send({
          ...defaultCreateUserDto,
          email: 'another@example.com',
          username: 'anotheruser',
        });

      // Try to delete first user's profile while authenticated as second user
      const unauthorizedResponse = await request(app.getHttpServer())
        .delete(`/profiles/${firstUserResponse.body.data.id}`)
        .set('Cookie', secondUserResponse.headers['set-cookie'])
        .set('Authorization', secondUserResponse.headers.authorization);

      expect(unauthorizedResponse.status).toBe(403);
      expect(unauthorizedResponse.body.message).toBe(
        'Forbidden. You can only delete your own profile',
      );
    });

    it('should return 404 when profile does not exist', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      const nonExistentProfileResponse = await request(app.getHttpServer())
        .delete('/profiles/999')
        .set('Cookie', registerResponse.headers['set-cookie'])
        .set('Authorization', registerResponse.headers.authorization);

      expect(nonExistentProfileResponse.status).toBe(404);
      expect(nonExistentProfileResponse.body.message).toBe(
        errorMessages.ENTITY_NOT_FOUND('Profile', '999'),
      );
    });
  });
});
