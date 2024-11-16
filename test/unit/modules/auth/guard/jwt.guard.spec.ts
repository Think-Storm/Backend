import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { defaultUser } from '../../user/user.utils';
import { AuthService } from '../../../../../src/modules/auth/auth.service';
import { UserRepository } from '../../../../../src/modules/user/user.repository';
import { ServiceException } from '../../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../../src/common/enums/errorMessages';
import { PasswordEncryption } from '../../../../../src/common/passwordEncryption';
import { JwtStrategy } from '../../../../../src/modules/auth/jwt/jwt.strategy';
import { LocalStrategy } from '../../../../../src/modules/auth/local/local.strategy';
import { UserController } from '../../../../../src/modules/user/user.controller';
import { UserService } from '../../../../../src/modules/user/user.service';
import { JwtAuthGuard } from '../../../../../src/modules/auth/jwt/jwt.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '../../../../../src/prisma/prisma.module';
import { UserMapper } from '../../../../../src/modules/user/dtos/user.mapper';

describe('JwtAuthGuard', () => {
  jest.useFakeTimers();

  let guard: JwtAuthGuard;
  let authService: AuthService;
  let userRepository: UserRepository;
  let passwordEncryption: PasswordEncryption;
  const prismaClient = new PrismaClient();

  beforeEach(async () => {
    guard = new JwtAuthGuard();
    const app: TestingModule = await Test.createTestingModule({
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
        AuthService,
        UserService,
        UserRepository,
        UserMapper,
        PasswordEncryption,
        JwtStrategy,
        LocalStrategy,
        ConfigService,
      ],
    }).compile();

    authService = app.get<AuthService>(AuthService);
    userRepository = app.get<UserRepository>(UserRepository);
    passwordEncryption = app.get<PasswordEncryption>(PasswordEncryption);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // success
  it('should return true with bearer token', async () => {
    const context = createMock<ExecutionContext>();

    const token = authService.signToken(defaultUser.id);

    context.switchToHttp().getRequest.mockReturnValue({
      headers: {
        authorization: 'Bearer ' + token,
      },
    });

    // Mock call to DB
    jest.spyOn(userRepository, 'getUserById').mockResolvedValue(defaultUser);

    jest
      .spyOn(passwordEncryption, 'changedPasswordAfter')
      .mockResolvedValue(false);

    expect(guard.canActivate(context)).toBeTruthy();
  });

  it('should return true with jwt token in cookie', () => {
    const context = createMock<ExecutionContext>();

    const token = authService.signToken(defaultUser.id);

    context.switchToHttp().getRequest.mockReturnValue({
      cookies: {
        jwt: token,
      },
    });

    // Mock call to DB
    jest.spyOn(userRepository, 'getUserById').mockResolvedValue(defaultUser);

    jest
      .spyOn(passwordEncryption, 'changedPasswordAfter')
      .mockResolvedValue(false);

    expect(guard.canActivate(context)).toBeTruthy();
  });

  // 1) without any token
  it('should throw 401 error without any auth token', () => {
    const context = createMock<ExecutionContext>();

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.UnAuthorizedException(errorMessages.PROTECT_ROUTES),
    );
  });

  // 2) invalid token
  it('should throw 401 error with invalid bearer token', () => {
    const context = createMock<ExecutionContext>();

    context.switchToHttp().getRequest.mockReturnValue({
      headers: {
        authorization: 'Bearer auth',
      },
    });

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.UnAuthorizedException(errorMessages.INVALID_TOKEN),
    );
  });

  it('should throw 401 error with invalid jwt token in cookie', () => {
    const context = createMock<ExecutionContext>();

    context.switchToHttp().getRequest.mockReturnValue({
      cookies: {
        jwt: 'auth',
      },
    });

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.UnAuthorizedException(errorMessages.INVALID_TOKEN),
    );
  });

  // 3) expired token
  it('should throw 401 error with expired bearer token', () => {
    const context = createMock<ExecutionContext>();

    const token = authService.signToken(defaultUser.id);

    context.switchToHttp().getRequest.mockReturnValue({
      headers: {
        authorization: 'Bearer ' + token,
      },
    });

    jest.advanceTimersByTime(
      Number.parseInt(process.env.JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000,
    );

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.UnAuthorizedException(errorMessages.TOKEN_EXPIRED),
    );
  });

  it('should throw 401 error with expired jwt token in cookie', () => {
    const context = createMock<ExecutionContext>();

    const token = authService.signToken(defaultUser.id);

    context.switchToHttp().getRequest.mockReturnValue({
      cookies: {
        jwt: token,
      },
    });

    jest.advanceTimersByTime(
      Number.parseInt(process.env.JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000,
    );

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.UnAuthorizedException(errorMessages.TOKEN_EXPIRED),
    );
  });

  // 4) user does not exist
  it('should throw 404 error if user does not exist with bearer token', () => {
    const context = createMock<ExecutionContext>();

    const token = authService.signToken(defaultUser.id);

    context.switchToHttp().getRequest.mockReturnValue({
      headers: {
        authorization: 'Bearer ' + token,
      },
    });

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.UnAuthorizedException(
        errorMessages.ENTITY_NOT_FOUND('User', String(defaultUser.id)),
      ),
    );
  });

  it('should throw 404 error if user does not exist with jwt token', () => {
    const context = createMock<ExecutionContext>();

    const token = authService.signToken(defaultUser.id);

    context.switchToHttp().getRequest.mockReturnValue({
      cookies: {
        jwt: token,
      },
    });

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.UnAuthorizedException(
        errorMessages.ENTITY_NOT_FOUND('User', String(defaultUser.id)),
      ),
    );
  });

  //5) password has been changed
  it('should throw 401 error if password has been changed with bearer token', () => {
    const context = createMock<ExecutionContext>();

    const token = authService.signToken(defaultUser.id);

    context.switchToHttp().getRequest.mockReturnValue({
      headers: {
        authorization: 'Bearer ' + token,
      },
    });

    //Mock call to DB
    jest.spyOn(userRepository, 'getUserById').mockResolvedValue(defaultUser);

    jest
      .spyOn(passwordEncryption, 'changedPasswordAfter')
      .mockResolvedValue(true);

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.UnAuthorizedException(
        errorMessages.USER_CHANGED_PASSWORD,
      ),
    );
  });

  it('should throw 401 error if password has been changed with jwt token', () => {
    const context = createMock<ExecutionContext>();

    const token = authService.signToken(defaultUser.id);

    context.switchToHttp().getRequest.mockReturnValue({
      cookies: {
        jwt: token,
      },
    });

    //Mock call to DB
    jest.spyOn(userRepository, 'getUserById').mockResolvedValue(defaultUser);

    jest
      .spyOn(passwordEncryption, 'changedPasswordAfter')
      .mockResolvedValue(true);

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.UnAuthorizedException(
        errorMessages.USER_CHANGED_PASSWORD,
      ),
    );
  });
});
