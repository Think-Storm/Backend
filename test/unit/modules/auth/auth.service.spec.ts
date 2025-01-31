import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const httpMocks = require('node-mocks-http');
import { UserService } from '../../../../src/modules/user/user.service';
import {
  defaultCreateUserDto,
  defaultUser,
  defaultUserResponseDto,
} from '../../../utils/user.utils';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { PasswordEncryption } from '../../../../src/common/passwordEncryption';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { UserController } from '../../../../src/modules/user/user.controller';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { JsonWebTokenError, JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import prisma from '../../../../src/prisma/prisma.client';
import { PassportModule } from '@nestjs/passport';
import { defaultSaltAndPassword } from '../../common/passwordEncryption.utils';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let userRepository: UserRepository;
  let passwordEncryption: PasswordEncryption;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule.forTest(prisma),
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
        UserMapper,
        PasswordEncryption,
        AuthService,
        ConfigService,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    passwordEncryption = module.get<PasswordEncryption>(PasswordEncryption);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('IsUserCreateDtoValid function', () => {
    it('should throw an exception if user already exists with email', async () => {
      // Mock call to DB to return a User
      const spy = jest
        .spyOn(userRepository, 'getUserByEmail')
        .mockResolvedValue(defaultUser);

      expect(
        authService.isUserCreateDtoValid(defaultCreateUserDto),
      ).rejects.toThrow(ServiceException);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not throw an exception if no user exists with email', async () => {
      // Mock call to DB not to return a User
      const spy = jest
        .spyOn(userRepository, 'getUserByEmail')
        .mockResolvedValue(null);

      expect(() =>
        authService.isUserCreateDtoValid(defaultCreateUserDto),
      ).not.toThrow();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('register function', () => {
    it('should create user and map the result into UserResponseDto', async () => {
      // Mock call to Dto validator
      const validatorSpy = jest.spyOn(authService, 'isUserCreateDtoValid');

      // Mock call to the password and salt creation
      const passwordSpy = jest
        .spyOn(passwordEncryption, 'createSaltAndHashedPassword')
        .mockResolvedValue(defaultSaltAndPassword);

      // Mock call to DB
      const dbSpy = jest
        .spyOn(userRepository, 'createUser')
        .mockResolvedValue(defaultUser);

      const expectedResponseDto = {
        id: defaultUser.id,
        email: defaultUser.email,
        username: defaultUser.username,
        fullName: defaultUser.fullName,
        birthdate: defaultUser.birthdate,
        createdAt: defaultUser.createdAt,
        lastUpdatedAt: defaultUser.lastUpdatedAt,
      };

      const userResponseDto = await authService.register(defaultCreateUserDto);

      expect(validatorSpy).toHaveBeenCalledTimes(1);
      // Checking the mapper
      expect(userResponseDto).toEqual(expectedResponseDto);
      expect(userResponseDto).not.toHaveProperty('password');
      expect(userResponseDto).not.toHaveProperty('passwordSalt');

      expect(passwordSpy).toHaveBeenCalledTimes(1);

      expect(dbSpy).toHaveBeenCalledTimes(1);
      expect(dbSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          password: defaultSaltAndPassword.hashedPassword,
        }),
        defaultSaltAndPassword.passwordSalt,
      );
    });

    it('should throw 404 error if user is not found', async () => {
      // create User
      await authService.register(defaultCreateUserDto);

      try {
        await userService.getUserById(999);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toEqual(
          errorMessages.ENTITY_NOT_FOUND('User', '999'),
        );
      }
    });
  });

  describe('checkUserAndPassword function', () => {
    it('should return user with right email and password', async () => {
      const password = 'hassedPassword';
      // Mock call to DB to return a User
      const emailCheckSpy = jest
        .spyOn(userRepository, 'getUserByEmail')
        .mockResolvedValue(defaultUser);

      const passwordCheckSpy = jest
        .spyOn(passwordEncryption, 'isPasswordCorrect')
        .mockResolvedValue(true);

      expect(
        await authService.checkUserAndPassword(defaultUser.email, password),
      ).toBe(defaultUser);

      expect(emailCheckSpy).toHaveBeenCalledTimes(1);
      expect(passwordCheckSpy).toHaveBeenCalledTimes(1);
      expect(passwordCheckSpy).toHaveBeenCalledWith(
        password,
        defaultUser.password,
      );
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
        .spyOn(passwordEncryption, 'isPasswordCorrect')
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
