/* eslint-disable @typescript-eslint/no-var-requires */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserModule } from '../../src/modules/user/user.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ServiceException } from '../../src/common/exception-filter/serviceException';
import { PrismaModule } from '../../src/prisma/prisma.module';
import {
  createMockPasswordResetToken,
  defaultForgotPasswordDto,
  defaultLoginUserDto,
  defaultUpdatePasswordDto,
} from '../utils/auth.utils';
import {
  defaultCreateUserDto,
  defaultUserResponseDto,
} from '../utils/user.utils';
import prisma from '../../src/prisma/prisma.client';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { errorMessages } from '../../src/common/enums/errorMessages';
import refreshDatabase from '../../src/prisma/prisma.dbreset';
import { AppModule } from './../../src/app.module';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RedisThrottlerStorageService } from '../../src/common/throttler/redisThrottlerStorage.service';
import { PasswordEncryption } from '../../src/common/encryption/passwordEncryption';
import { JwtHelperService } from '../../src/modules/auth/jwt/jwt-helper.service';
import { UserRepository } from '../../src/modules/user/user.repository';
import { MailService } from '../../src/modules/mail/mail.service';
import * as jwt from 'jsonwebtoken';

describe('/', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let passwordEncryption: PasswordEncryption;
  let jwtHelperService: JwtHelperService;
  let userRepository: UserRepository;

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
      .overrideProvider(MailService)
      .useValue({
        forgotPassword: jest.fn().mockResolvedValue(undefined),
        sendMail: jest.fn().mockResolvedValue(undefined),
        sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    passwordEncryption =
      moduleFixture.get<PasswordEncryption>(PasswordEncryption);
    jwtHelperService = moduleFixture.get<JwtHelperService>(JwtHelperService);
    userRepository = moduleFixture.get<UserRepository>(UserRepository);
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
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.lastUpdatedAt).toBeDefined();

      const { body: registeredUser } = await request(app.getHttpServer())
        .get(`/users/${response.body.data.id}`)
        .expect(200);
      expect(registeredUser.id).toBe(1);
      expect(registeredUser.email).toBe(defaultCreateUserDto.email);
      expect(registeredUser.username).toBe(defaultCreateUserDto.username);
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

  describe('/logout POST (logout)', () => {
    afterEach(async () => {
      process.env.JWT_EXPIRES_IN = '90d'; // Reset to default expiration
    });

    it('should return a 200 if everything is fine', async () => {
      // First register and login to get valid tokens
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      const token = registerResponse.headers.authorization.split(' ')[1];

      await request(app.getHttpServer())
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect({
          message: 'logout success',
        });
    });

    it('should return 401 if user is not logged in', async () => {
      // Direct logout attempt without login
      await request(app.getHttpServer()).post('/logout').expect(401).expect({
        statusCode: 401,
        message: errorMessages.PROTECT_ROUTES,
      });
    });

    it('should return 401 if JWT token is invalid', async () => {
      await request(app.getHttpServer())
        .post('/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
        .expect({
          statusCode: 401,
          message: errorMessages.INVALID_TOKEN,
        });
    });

    it('should return 401 if JWT token is expired', async () => {
      // Store original expiration
      const originalExpiration = process.env.JWT_EXPIRES_IN;

      // Set very short expiration
      process.env.JWT_EXPIRES_IN = '1s';

      // Create new app instance with updated JWT config
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          AppModule,
          AuthModule,
          UserModule,
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

      const newApp = moduleFixture.createNestApplication();
      await newApp.init();

      // Register to get a token
      const registerResponse = await request(newApp.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      const token = registerResponse.headers.authorization.split(' ')[1];

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Try logout with expired token
      const response = await request(newApp.getHttpServer())
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: errorMessages.TOKEN_EXPIRED,
      });

      // Cleanup
      process.env.JWT_EXPIRES_IN = originalExpiration;
      await newApp.close();
    }, 10000);

    it('should return 401 if user changed password after token was issued', async () => {
      // Register and get token
      const registerResponse = await request(app.getHttpServer())
        .post('/register')
        .send(defaultCreateUserDto);

      const token = registerResponse.headers.authorization.split(' ')[1];
      const userId = registerResponse.body.data.id;

      // Decode the token to get the issue time (iat)
      const decodedToken = await jwtHelperService.verifyAndDecodeToken(token);
      const tokenIssueTime = decodedToken.iat;

      // Generate new password hash
      const { hashedPassword: newPassword } =
        await passwordEncryption.createSaltAndHashedPassword('newPassword');

      // Set password change time to a time after the token was issued
      const passwordChangedAt = new Date((tokenIssueTime + 10) * 1000); // 10 seconds after

      // Update user with new password and change time
      await prismaService.user.update({
        where: { id: userId },
        data: {
          password: newPassword,
          passwordChangedAt: passwordChangedAt,
        },
      });

      // Try logout with old token
      const response = await request(app.getHttpServer())
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: errorMessages.USER_CHANGED_PASSWORD,
      });
    }, 10000);

    describe('/forgot-password (Forgot Password)', () => {
      let resetToken: string;
      let userId: number;

      beforeEach(async () => {
        const registerResponse = await request(app.getHttpServer())
          .post('/register')
          .send(defaultCreateUserDto);

        userId = registerResponse.body.data.id;
      });

      it('should send forgot password email if user exists', async () => {
        const response = await request(app.getHttpServer())
          .post('/forgot-password')
          .send(defaultForgotPasswordDto)
          .expect(201);

        expect(response.body.email).toEqual(defaultUserResponseDto.email);
        expect(response.body.id).toEqual(defaultUserResponseDto.id);
      });

      it('should return 404 if user does not exist', async () => {
        const notFoundEmail = 'notfound@email.com';
        const response = await request(app.getHttpServer())
          .post('/forgot-password')
          .send({ ...defaultForgotPasswordDto, email: notFoundEmail })
          .expect(404);

        expect(response.body.message).toContain(
          `User with ${notFoundEmail} was not found.`,
        );
      });

      it('should return 400 if email is missing', async () => {
        const response = await request(app.getHttpServer())
          .post('/forgot-password')
          .send({})
          .expect(400);

        expect(response.body.message).toContain('email');
      });

      it('should update password with valid token', async () => {
        const user = await userRepository.getUserByEmail(
          defaultCreateUserDto.email,
        );
        resetToken = jwt.sign(
          { id: user.id, iat: Math.floor(Date.now() / 1000) },
          process.env.JWT_SECRET,
          { expiresIn: '15m' },
        );

        const response = await request(app.getHttpServer())
          .put('/forgot-password')
          .send({ ...defaultUpdatePasswordDto, passwordResetToken: resetToken })
          .expect(200);

        expect(response.body.message).toBe('Update User Password Success');
        expect(response.body.data.email).toBe(defaultCreateUserDto.email);

        const loginResponse = await request(app.getHttpServer())
          .post('/login')
          .send({
            email: defaultCreateUserDto.email,
            password: defaultUpdatePasswordDto.password,
          })
          .expect(200);

        expect(loginResponse.body.data.email).toBe(defaultCreateUserDto.email);
      });

      it('should return 401 if token is invalid', async () => {
        const response = await request(app.getHttpServer())
          .put('/forgot-password')
          .send({
            ...defaultUpdatePasswordDto,
            passwordResetToken: 'invalid.token.value',
          })
          .expect(401);

        expect(response.body.message).toContain('Invalid Token');
      });

      it('should return 401 if token is expired', async () => {
        const expiredToken = jwt.sign(
          { id: userId, iat: Math.floor(Date.now() / 1000) - 3600 },
          process.env.JWT_SECRET,
          { expiresIn: '-1s' },
        );

        const response = await request(app.getHttpServer())
          .put('/forgot-password')
          .send({
            ...defaultUpdatePasswordDto,
            passwordResetToken: expiredToken,
          })
          .expect(401);

        expect(response.body.message).toContain('expired');
      });

      it('should return 404 if user does not exist for password reset', async () => {
        const fakeToken = jwt.sign(
          { id: 99999, iat: Math.floor(Date.now() / 1000) },
          process.env.JWT_SECRET,
          { expiresIn: '15m' },
        );

        const response = await request(app.getHttpServer())
          .put('/forgot-password')
          .send({
            ...defaultUpdatePasswordDto,
            email: 'notfound@email.com',
            passwordResetToken: fakeToken,
          })
          .expect(401);

        expect(response.body.message).toContain(
          'User with id 99999 was not found',
        );
      });

      it('should return 403 if email does not match token user', async () => {
        const registerRes = await request(app.getHttpServer())
          .post('/register')
          .send(defaultCreateUserDto);
        const userId = registerRes.body.id;

        await request(app.getHttpServer())
          .post('/register')
          .send({ ...defaultCreateUserDto, email: 'other@email.com' });

        const resetToken = createMockPasswordResetToken(userId);

        const response = await request(app.getHttpServer())
          .put('/forgot-password')
          .send({
            ...defaultUpdatePasswordDto,
            email: 'other@email.com',
            passwordResetToken: resetToken,
          })
          .expect(403);

        expect(response.body.message).toContain(
          'You are not the owner of this account',
        );
      });
    });
  });
});
