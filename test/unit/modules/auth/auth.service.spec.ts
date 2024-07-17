import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const httpMocks = require('node-mocks-http');
import { UserService } from '../../../../src/modules/user/user.service';
import { defaultUser, defaultUserResponseDto } from '../user/user.utils';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { PasswordEncryption } from '../../../../src/common/passwordEncryption';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { UserController } from '../../../../src/modules/user/user.controller';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { AuthRepository } from '../../../../src/modules/auth/auth.repository';
import { JsonWebTokenError, JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { PrismaClient } from '@prisma/client';
import { PassportModule } from '@nestjs/passport';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: UserRepository;
  let passwordEncryption: PasswordEncryption;

  const prismaClient = new PrismaClient();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule.forTest(prismaClient),
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
      ],
      controllers: [UserController],
      providers: [
        UserService,
        UserRepository,
        PasswordEncryption,
        UserMapper,
        AuthService,
        AuthRepository,
        ConfigService,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    passwordEncryption = module.get<PasswordEncryption>(PasswordEncryption);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkUserAndPassword function', () => {
    it('should return user with right email and password', async () => {
      const password = 'hassedPassword';
      // Mock call to DB to return a User
      const emailCheckSpy = jest
        .spyOn(userRepository, 'getUserByEmail')
        .mockResolvedValue(defaultUser);

      const passwordCheckSpy = jest
        .spyOn(passwordEncryption, 'correctPassword')
        .mockResolvedValue(true);

      expect(
        await authService.checkUserAndPassword(defaultUser.email, password),
      ).toBe(defaultUser);

      expect(emailCheckSpy).toHaveBeenCalledTimes(1);
      expect(passwordCheckSpy).toHaveBeenCalledTimes(1);
    });

    it('should return 401 error if user does not exist', async () => {
      const password = 'hashedPassword';
      // Mock call to DB to return a User
      const emailCheckSpy = jest
        .spyOn(userRepository, 'getUserByEmail')
        .mockResolvedValue(undefined);

      try {
        await authService.checkUserAndPassword(defaultUser.email, password);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toEqual(errorMessages.INCORRECT_EMAIL_OR_PASSWORD);
      }

      expect(emailCheckSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw 401 error with incorrect password', async () => {
      const password = 'hashedPassword';
      // Mock call to DB not to return a User
      const emailCheckSpy = jest
        .spyOn(userRepository, 'getUserByEmail')
        .mockResolvedValue(defaultUser);

      const passwordCheckSpy = jest
        .spyOn(passwordEncryption, 'correctPassword')
        .mockResolvedValue(false);

      try {
        await authService.checkUserAndPassword(defaultUser.email, password);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toEqual(errorMessages.INCORRECT_EMAIL_OR_PASSWORD);
      }

      expect(emailCheckSpy).toHaveBeenCalledTimes(1);
      expect(passwordCheckSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('signToken function', () => {
    it('should return true with token with id', async () => {
      // Json Web Token Format
      expect(authService.signToken(defaultUser.id)).toMatch(
        /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/]*/,
      );
    });
  });

  describe('verifyToken function', () => {
    it('should return token with id', async () => {
      const token = authService.signToken(defaultUser.id);

      expect(
        (await authService.verifyToken(token, process.env.JWT_SECRET)).id,
      ).toBe(defaultUser.id);
    });

    it('should return false with wrong token format', async () => {
      //generated token withtout id
      const tokenString =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MjEwODk4MTcsImV4cCI6MTcyMTA4OTgxOH0.oSDl-qP_lJVhEoQByEhHqb2euLVyHZVk6cPPMIMghNw';

      try {
        await authService.verifyToken(tokenString, process.env.JWT_SECRET);
      } catch (e) {
        expect(e).toBeInstanceOf(JsonWebTokenError);
        expect(e.message).toEqual('invalid signature');
      }
    });
  });

  describe('getToken function', () => {
    it('should return token with assigned user', async () => {
      const token = authService.signToken(defaultUser.id);

      expect(authService.getToken(defaultUserResponseDto)).toBe(token);
    });
  });

  describe('authentication function', () => {
    it('should get bearer token and jwt token in cookie', async () => {
      const res = httpMocks.createResponse();

      expect(authService.authentication(defaultUserResponseDto, res)).toBe(
        defaultUserResponseDto,
      );
      expect(res.getHeader('authorization')).toContain('Bearer ');
      expect(res.cookies.jwt.value).toBeDefined();
    });
  });
});
