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
import { AuthRepository } from '../../../../../src/modules/auth/auth.repository';
import { PrismaService } from '../../../../../src/prisma/prisma.service';
import { UserMapper } from '../../../../../src/modules/user/dtos/user.mapper';
import { UserController } from '../../../../../src/modules/user/user.controller';
import { UserService } from '../../../../../src/modules/user/user.service';
import { JwtAuthGuard } from '../../../../../src/modules/auth/jwt/jwt.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let authService: AuthService;
  let userRepository: UserRepository;
  let passwordEncryption: PasswordEncryption;

  beforeEach(async () => {
    guard = new JwtAuthGuard();
    const app: TestingModule = await Test.createTestingModule({
      imports: [
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
        AuthRepository,
        AuthService,
        UserService,
        UserRepository,
        UserMapper,
        PasswordEncryption,
        JwtStrategy,
        LocalStrategy,
        PrismaService,
      ],
    }).compile();

    authService = app.get<AuthService>(AuthService);
    userRepository = app.get<UserRepository>(UserRepository);
    passwordEncryption = app.get<PasswordEncryption>(PasswordEncryption);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

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

  it('should throw 401 error without auth token', () => {
    const context = createMock<ExecutionContext>();

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.AuthException(errorMessages.PROTECT_ROUTES),
    );
  });

  it('should throw 401 error with invalid bearer token', () => {
    const context = createMock<ExecutionContext>();

    context.switchToHttp().getRequest.mockReturnValue({
      headers: {
        authorization: 'Bearer auth',
      },
    });

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.AuthException(errorMessages.INVALID_TOKEN),
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
      ServiceException.AuthException(errorMessages.INVALID_TOKEN),
    );
  });

  it('should throw 401 error with invalid bearer token', () => {
    const context = createMock<ExecutionContext>();

    context.switchToHttp().getRequest.mockReturnValue({
      headers: {
        authorization: 'Bearer auth',
      },
    });

    expect(guard.canActivate(context)).rejects.toThrow(
      ServiceException.AuthException(errorMessages.INVALID_TOKEN),
    );
  });
});
