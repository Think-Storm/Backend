import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalAuthGuard } from '../../../../../src/modules/auth/local/local.guard';
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

describe('LocalAuthGuard', () => {
  let authService: AuthService;
  let userRepository: UserRepository;
  let passwordEncryption: PasswordEncryption;
  let guard: LocalAuthGuard;

  beforeEach(async () => {
    guard = new LocalAuthGuard();

    const app: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt', session: false }),
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
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
        JwtService,
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

  it('should return true with right email and password', async () => {
    const context = createMock<ExecutionContext>();

    context.switchToHttp().getRequest.mockReturnValue({
      body: {
        email: defaultUser.email,
        password: defaultUser.password,
      },
    });

    // Mock call to DB
    jest.spyOn(userRepository, 'getUserByEmail').mockResolvedValue(defaultUser);
    jest.spyOn(passwordEncryption, 'correctPassword').mockResolvedValue(true);

    expect(await guard.canActivate(context)).toBeTruthy();
  });

  it('should return false without email field', () => {
    const context = createMock<ExecutionContext>();

    context.switchToHttp().getRequest.mockReturnValue({
      body: {
        password: defaultUser.password,
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

    context.switchToHttp().getRequest.mockReturnValue({
      body: {
        email: defaultUser.email,
        password: defaultUser.password,
      },
    });

    jest.spyOn(userRepository, 'getUserByEmail').mockResolvedValue(undefined);

    await expect(async () => {
      await authService.checkUserAndPassword(
        defaultUser.email,
        defaultUser.password,
      );
    }).rejects.toThrow(
      ServiceException.AuthException(errorMessages.INCORRECT_EMAIL_OR_PASSWORD),
    );

    //expect(await guard.canActivate(context)).toBeFalsy();
  });

  it('should return false with incorrect password', async () => {
    const context = createMock<ExecutionContext>();

    context.switchToHttp().getRequest.mockReturnValue({
      body: {
        email: defaultUser.email,
        password: defaultUser.password,
      },
    });

    // Mock call to DB
    jest.spyOn(userRepository, 'getUserByEmail').mockResolvedValue(defaultUser);
    // Mock call to DB
    jest.spyOn(passwordEncryption, 'correctPassword').mockResolvedValue(false);

    await expect(async () => {
      await authService.checkUserAndPassword(
        defaultUser.email,
        defaultUser.password,
      );
    }).rejects.toThrow(
      ServiceException.AuthException(errorMessages.INCORRECT_EMAIL_OR_PASSWORD),
    );

    // expect(guard.canActivate(context)).rejects.toThrow(
    //   ServiceException.AuthException(errorMessages.INCORRECT_EMAIL_OR_PASSWORD),
    // );
  });
});
