/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const httpMocks = require('node-mocks-http');
import { JwtModule } from '@nestjs/jwt';
import { PasswordEncryption } from '../../../../src/common/encryption/passwordEncryption';
import {
  defaultCreateUserDto,
  defaultUserResponseDto,
} from '../../../utils/user.utils';
import { AuthController } from '../../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import RequestWithUser from '../../../../src/modules/auth/local/requestWithUser.interface';
import { LocalAuthGuard } from '../../../../src/modules/auth/local/local.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import prisma from '../../../../src/prisma/prisma.client';
import { PassportModule } from '@nestjs/passport';
import { UserService } from '../../../../src/modules/user/user.service';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { JwtAuthGuard } from '../../../../src/modules/auth/jwt/jwt.guard';
import { JwtStrategy } from '../../../../src/modules/auth/jwt/jwt.strategy';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let userRepository: UserRepository;

  const mockUserRepository = {
    getUserById: jest.fn().mockResolvedValue(defaultUserResponseDto),
    getUserByEmail: jest.fn().mockResolvedValue(defaultUserResponseDto),
    createUser: jest.fn().mockResolvedValue(defaultUserResponseDto),
  };

  const mockJwtStrategy = {
    validate: jest.fn().mockResolvedValue(defaultUserResponseDto),
    checkUserExistsInDB: jest.fn().mockResolvedValue(defaultUserResponseDto),
    checkTokenExists: jest.fn().mockReturnValue('valid-token'),
    verifyAndDecodeToken: jest.fn().mockResolvedValue({
      id: defaultUserResponseDto.id,
      iat: Date.now() / 1000,
    }),
    checkUserPasswordChanged: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule.forTest(prisma),
        ConfigModule.forRoot({ isGlobal: true }),
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
      controllers: [AuthController],
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        UserMapper,
        PasswordEncryption,
        AuthService,
        ConfigService,
        {
          provide: JwtStrategy,
          useValue: mockJwtStrategy,
        },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    authController = app.get<AuthController>(AuthController);
    authService = app.get<AuthService>(AuthService);
    userRepository = app.get<UserRepository>(UserRepository);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login function', () => {
    it('should return logged in user responseDto and jwt token', async () => {
      const req = {
        user: defaultUserResponseDto,
      } as RequestWithUser;
      const res = httpMocks.createResponse();

      const authSpy = jest
        .spyOn(authService, 'authentication')
        .mockReturnValue(defaultUserResponseDto);

      const response = await authController.login(req, res);

      expect(authSpy).toHaveBeenCalledWith(defaultUserResponseDto, res);
      expect(response._getData()).toEqual({
        message: 'login success',
        data: defaultUserResponseDto,
      });
    });

    it('should handle unauthorized access', async () => {
      const req = { user: null } as RequestWithUser;
      const res = httpMocks.createResponse();

      jest.spyOn(authService, 'authentication').mockImplementation(() => {
        throw ServiceException.UnAuthorizedException(
          errorMessages.INCORRECT_EMAIL_OR_PASSWORD,
        );
      });

      await expect(authController.login(req, res)).rejects.toThrow(
        ServiceException,
      );
    });
  });

  describe('register function', () => {
    it('should handle registration of new user', async () => {
      const res = httpMocks.createResponse();

      jest
        .spyOn(authService, 'register')
        .mockResolvedValue(defaultUserResponseDto);
      jest
        .spyOn(authService, 'authentication')
        .mockReturnValue(defaultUserResponseDto);

      const response = await authController.register(defaultCreateUserDto, res);

      expect(response._getData()).toEqual({
        message: 'register success',
        data: defaultUserResponseDto,
      });
    });
  });

  afterAll(() => {
    jest.resetAllMocks();
  });
});
