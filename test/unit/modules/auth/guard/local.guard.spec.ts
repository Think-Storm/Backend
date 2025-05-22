import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalAuthGuard } from '../../../../../src/modules/auth/local/local.guard';
import { defaultUser } from '../../../../utils/user.utils';
import { AuthService } from '../../../../../src/modules/auth/auth.service';
import { UserRepository } from '../../../../../src/modules/user/user.repository';
import { ServiceException } from '../../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../../src/common/enums/errorMessages';
import { PasswordEncryption } from '../../../../../src/common/encryption/passwordEncryption';
import { JwtStrategy } from '../../../../../src/modules/auth/jwt/jwt.strategy';
import { LocalStrategy } from '../../../../../src/modules/auth/local/local.strategy';
import { UserMapper } from '../../../../../src/modules/user/dtos/user.mapper';
import { UserService } from '../../../../../src/modules/user/user.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import prisma from '../../../../../src/prisma/prisma.client';
import { PrismaModule } from '../../../../../src/prisma/prisma.module';
import { NotificationService } from '../../../../../src/modules/notification/notification.service';
import { NotificationRepository } from '../../../../../src/modules/notification/notification.repository';
import { JwtHelperService } from '../../../../../src/modules/auth/jwt/jwt-helper.service';
import { MailService } from '../../../../../src/modules/mail/mail.service';

describe('LocalAuthGuard', () => {
  let userService: UserService;
  let authService: AuthService;
  let userRepository: UserRepository;
  let passwordEncryption: PasswordEncryption;
  let guard: LocalAuthGuard;

  const mockUserRepository = {
    getUserById: jest.fn().mockResolvedValue(defaultUser),
    getUserByEmail: jest.fn().mockResolvedValue(defaultUser),
  };

  const mockJwtStrategy = {
    validate: jest.fn().mockResolvedValue(defaultUser),
    checkUserExistsInDB: jest.fn().mockResolvedValue(defaultUser),
    checkTokenExists: jest.fn().mockReturnValue('valid-token'),
    verifyAndDecodeToken: jest.fn().mockResolvedValue({
      id: defaultUser.id,
      iat: Date.now() / 1000,
    }),
    checkUserPasswordChanged: jest.fn().mockResolvedValue(undefined),
  };

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
      providers: [
        AuthService,
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        NotificationService,
        NotificationRepository,
        UserRepository,
        UserMapper,
        PasswordEncryption,
        {
          provide: JwtStrategy,
          useValue: mockJwtStrategy,
        },
        LocalStrategy,
        ConfigService,
        JwtHelperService,
        MailService,
      ],
    }).compile();

    guard = new LocalAuthGuard();
    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    passwordEncryption = module.get<PasswordEncryption>(PasswordEncryption);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true with right email and password', async () => {
    const context = createMock<ExecutionContext>();

    const password = 'hassedPassword';
    context.switchToHttp().getRequest.mockReturnValue({
      body: {
        email: defaultUser.email,
        password,
      },
    });

    // Mock call to DB
    jest
      .spyOn(userService, 'doesUserWithEmailExist')
      .mockResolvedValue(defaultUser);
    jest.spyOn(passwordEncryption, 'isPasswordCorrect').mockResolvedValue(true);

    expect(await guard.canActivate(context)).toBeTruthy();
  });

  it('should return false without email field', () => {
    const context = createMock<ExecutionContext>();

    const password = 'hassedPassword';
    context.switchToHttp().getRequest.mockReturnValue({
      body: {
        password,
      },
    });

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.BadRequestException(
        errorMessages.BAD_REQUEST_LOGIN_ERROR,
      ),
    );
  });

  it('should return false without password field', () => {
    const context = createMock<ExecutionContext>();

    context.switchToHttp().getRequest.mockReturnValue({
      body: {
        email: defaultUser.email,
      },
    });

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.BadRequestException(
        errorMessages.BAD_REQUEST_LOGIN_ERROR,
      ),
    );
  });

  it('should return false if user does not exist', async () => {
    const context = createMock<ExecutionContext>();

    const password = 'hassedPassword';
    context.switchToHttp().getRequest.mockReturnValue({
      body: {
        email: defaultUser.email,
        password,
      },
    });

    try {
      await authService.checkUserAndPassword(defaultUser.email, password);
    } catch (e) {
      expect(e).toBeInstanceOf(ServiceException);
      expect(e.message).toEqual(errorMessages.INCORRECT_EMAIL_OR_PASSWORD);
    }

    try {
      await guard.canActivate(context);
    } catch (e) {
      expect(e).toBeInstanceOf(ServiceException);
      expect(e.message).toEqual(errorMessages.INCORRECT_EMAIL_OR_PASSWORD);
    }
  });

  it('should return false with incorrect password', async () => {
    const context = createMock<ExecutionContext>();

    const password = 'hassedPassword';
    context.switchToHttp().getRequest.mockReturnValue({
      body: {
        email: defaultUser.email,
        password,
      },
    });

    // Mock call to DB
    jest.spyOn(userRepository, 'getUserByEmail').mockResolvedValue(defaultUser);
    // Mock call to DB
    jest
      .spyOn(passwordEncryption, 'isPasswordCorrect')
      .mockResolvedValue(false);

    try {
      await authService.checkUserAndPassword(defaultUser.email, password);
    } catch (e) {
      expect(e).toBeInstanceOf(ServiceException);
      expect(e.message).toEqual(errorMessages.INCORRECT_EMAIL_OR_PASSWORD);
    }

    try {
      await guard.canActivate(context);
    } catch (e) {
      expect(e).toBeInstanceOf(ServiceException);
      expect(e.message).toEqual(errorMessages.INCORRECT_EMAIL_OR_PASSWORD);
    }
  });
});
