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
import { PasswordEncryption } from '../../../../src/common/encryption/passwordEncryption';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { UserController } from '../../../../src/modules/user/user.controller';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { JsonWebTokenError, JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import prisma from '../../../../src/prisma/prisma.client';
import { PassportModule } from '@nestjs/passport';
import {
  defaultPasswordSalt,
  defaultSaltAndPassword,
} from '../../common/passwordEncryption.utils';
import { NotificationRepository } from '../../../../src/modules/notification/notification.repository';
import { NotificationService } from '../../../../src/modules/notification/notification.service';
import { MailService } from '../../../../src/modules/mail/mail.service';
import { JwtHelperService } from '../../../../src/modules/auth/jwt/jwt-helper.service';
import {
  mockJwtPayloadForPasswordReset,
  mockJwtToken,
} from '../../../utils/jwt.utils';
import {
  defaultForgotPasswordDto,
  defaultUpdatePasswordDto,
} from '../../../utils/auth.utils';
import { NotificationMapper } from '../../../../src/modules/notification/dtos/notification.mapper';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let userRepository: UserRepository;
  let passwordEncryption: PasswordEncryption;
  let notificationService: NotificationService;
  let jwtHelperService: JwtHelperService;
  let mailService: MailService;
  let jwtService: JwtService;
  let userMapper: UserMapper;
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
        NotificationService,
        NotificationMapper,
        NotificationRepository,
        MailService,
        JwtHelperService,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    notificationService = module.get<NotificationService>(NotificationService);
    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    passwordEncryption = module.get<PasswordEncryption>(PasswordEncryption);
    jwtHelperService = module.get<JwtHelperService>(JwtHelperService);
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
    userMapper = module.get<UserMapper>(UserMapper);
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

      const notificationSpy = jest
        .spyOn(notificationService, 'createWelcomeNotification')
        .mockImplementation();

      const expectedResponseDto = {
        ...defaultUserResponseDto,
        id: defaultUser.id,
        email: defaultUser.email,
        username: defaultUser.username,
        createdAt: defaultUser.createdAt,
        lastUpdatedAt: defaultUser.lastUpdatedAt,
        passwordChangedAt: defaultUser.passwordChangedAt,
      };

      const userResponseDto = await authService.register(defaultCreateUserDto);

      expect(validatorSpy).toHaveBeenCalledTimes(1);
      // Checking the mapper
      expect(userResponseDto).toEqual(expectedResponseDto);
      expect(userResponseDto).toHaveProperty('password');
      expect(userResponseDto).not.toHaveProperty('passwordSalt');

      expect(passwordSpy).toHaveBeenCalledTimes(1);

      expect(dbSpy).toHaveBeenCalledTimes(1);
      expect(dbSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          password: defaultSaltAndPassword.hashedPassword,
        }),
        defaultSaltAndPassword.passwordSalt,
      );
      expect(notificationSpy).toHaveBeenCalledTimes(1);
      expect(notificationSpy).toHaveBeenCalledWith(
        defaultUser.id,
        defaultUser.username,
      );
    });

    it('should throw 404 error if user is not found', async () => {
      // Mock repository to simulate user not found
      jest.spyOn(userRepository, 'getUserById').mockResolvedValue(null);

      // Use expect().rejects.toThrow() for async errors
      await expect(userService.getUserById(999)).rejects.toThrow(
        ServiceException.EntityNotFoundException(
          errorMessages.ENTITY_NOT_FOUND('User', '999'),
        ),
      );

      // Verify repository was called
      expect(userRepository.getUserById).toHaveBeenCalledWith(999);
    });

    it('should properly handle registration errors', async () => {
      // Mock repository to throw error
      jest
        .spyOn(userRepository, 'createUser')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        authService.register(defaultCreateUserDto),
      ).rejects.toThrow();
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

  describe('logout function', () => {
    it('should return logout options object', async () => {
      const logoutOptions = await authService.logout();

      expect(logoutOptions).toEqual({
        token: '',
        path: '/',
        httpOnly: true,
        maxAge: 0,
      });
    });
  });

  describe('sendForgotPassword', () => {
    it('should send forgot password email and return user response dto', async () => {
      jest
        .spyOn(userRepository, 'getUserByEmail')
        .mockResolvedValue(defaultUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockJwtToken);
      const mailSpy = jest
        .spyOn(mailService, 'forgotPassword')
        .mockResolvedValue(undefined);
      jest
        .spyOn(userMapper, 'userToUserResponseDTO')
        .mockReturnValue(defaultUserResponseDto);

      const result = await authService.sendForgotPassword(
        defaultForgotPasswordDto,
      );

      expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
        defaultUser.email,
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { id: defaultUser.id },
        { expiresIn: '15m' },
      );
      expect(mailSpy).toHaveBeenCalledWith(
        defaultUser.email,
        defaultUser.username,
        expect.stringContaining(
          `https://thinkstorm.app/reset-password?token=${mockJwtToken}`,
        ),
      );
      expect(result).toEqual(defaultUserResponseDto);
    });

    it('should throw if user is not found', async () => {
      jest.spyOn(userRepository, 'getUserByEmail').mockResolvedValue(null);

      await expect(
        authService.sendForgotPassword({
          ...defaultForgotPasswordDto,
          email: 'notfound@email.com',
        }),
      ).rejects.toThrow(
        ServiceException.EntityNotFoundException(
          errorMessages.ENTITY_NOT_FOUND_MSG('User', 'notfound@email.com'),
        ),
      );
    });
  });

  describe('updatePassword', () => {
    it('should update password and return user response dto', async () => {
      jest
        .spyOn(jwtHelperService, 'verifyAndDecodeToken')
        .mockResolvedValue(mockJwtPayloadForPasswordReset);
      jest
        .spyOn(jwtHelperService, 'checkUserExistsInDB')
        .mockResolvedValue(defaultUser);
      jest
        .spyOn(passwordEncryption, 'createSaltAndHashedPassword')
        .mockResolvedValue({
          passwordSalt: defaultPasswordSalt,
          hashedPassword: 'newHashedPassword',
        });
      jest
        .spyOn(userRepository, 'udpatePassword')
        .mockResolvedValue(defaultUser);
      jest.spyOn(userMapper, 'userToUserResponseDTO').mockReturnValue({
        ...defaultUserResponseDto,
        password: defaultUpdatePasswordDto.password,
      });

      const originalPassword = 'newpassword';

      const result = await authService.forgotUpdatePassword({
        ...defaultUpdatePasswordDto,
        password: originalPassword,
      });

      expect(jwtHelperService.verifyAndDecodeToken).toHaveBeenCalledWith(
        defaultUpdatePasswordDto.passwordResetToken,
      );
      expect(jwtHelperService.checkUserExistsInDB).toHaveBeenCalledWith(
        mockJwtPayloadForPasswordReset.id,
      );
      expect(
        passwordEncryption.createSaltAndHashedPassword,
      ).toHaveBeenCalledWith(defaultUpdatePasswordDto.password);
      expect(userRepository.udpatePassword).toHaveBeenCalledWith(
        expect.objectContaining({
          ...defaultUpdatePasswordDto,
          password: 'newHashedPassword',
        }),
        defaultPasswordSalt,
        defaultUser.id,
      );
      expect(result).toEqual({
        ...defaultUserResponseDto,
        password: originalPassword,
      });
    });

    it('should throw if verifyAndDecodeToken fails for invalid token', async () => {
      jest
        .spyOn(jwtHelperService, 'verifyAndDecodeToken')
        .mockRejectedValue(
          ServiceException.UnAuthorizedException(errorMessages.TOKEN_EXPIRED),
        );

      await expect(
        authService.forgotUpdatePassword(defaultUpdatePasswordDto),
      ).rejects.toThrow('Your token has expired.');
    });

    it('should throw if verifyAndDecodeToken fails for expired token', async () => {
      jest
        .spyOn(jwtHelperService, 'verifyAndDecodeToken')
        .mockRejectedValue(
          ServiceException.UnAuthorizedException(errorMessages.INVALID_TOKEN),
        );

      await expect(
        authService.forgotUpdatePassword(defaultUpdatePasswordDto),
      ).rejects.toThrow('Invalid Token.');
    });

    it('should throw if checkUserExistsInDB fails', async () => {
      jest
        .spyOn(jwtHelperService, 'verifyAndDecodeToken')
        .mockResolvedValue(mockJwtPayloadForPasswordReset);
      jest
        .spyOn(jwtHelperService, 'checkUserExistsInDB')
        .mockRejectedValue(
          ServiceException.UnAuthorizedException(
            errorMessages.ENTITY_NOT_FOUND(
              'User',
              String(mockJwtPayloadForPasswordReset.id),
            ),
          ),
        );

      await expect(
        authService.forgotUpdatePassword(defaultUpdatePasswordDto),
      ).rejects.toThrow(
        `User with id ${mockJwtPayloadForPasswordReset.id} was not found`,
      );
    });

    it('should throw if user is not the owner', async () => {
      jest
        .spyOn(jwtHelperService, 'verifyAndDecodeToken')
        .mockResolvedValue(mockJwtPayloadForPasswordReset);
      jest
        .spyOn(jwtHelperService, 'checkUserExistsInDB')
        .mockResolvedValue({ ...defaultUser, email: 'other@email.com' });

      await expect(
        authService.forgotUpdatePassword(defaultUpdatePasswordDto),
      ).rejects.toThrow(
        ServiceException.ForbiddenException(
          errorMessages.FORBIDDEN('You are not the owner of this account'),
        ),
      );
    });

    it('should throw if password hashing fails', async () => {
      jest
        .spyOn(jwtHelperService, 'verifyAndDecodeToken')
        .mockResolvedValue(mockJwtPayloadForPasswordReset);
      jest
        .spyOn(jwtHelperService, 'checkUserExistsInDB')
        .mockResolvedValue(defaultUser);
      jest
        .spyOn(passwordEncryption, 'createSaltAndHashedPassword')
        .mockRejectedValue(new Error('hash error'));

      await expect(
        authService.forgotUpdatePassword(defaultUpdatePasswordDto),
      ).rejects.toThrow('hash error');
    });
  });
});
