import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const httpMocks = require('node-mocks-http');
import { JwtModule } from '@nestjs/jwt';
import { PasswordEncryption } from '../../../../src/common/passwordEncryption';
import {
  defaultCreateUserDto,
  defaultUserResponseDto,
} from '../user/user.utils';
import { AuthController } from '../../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import RequestWithUser from '../../../../src/modules/auth/local/requestWithUser.interface';
import { LocalAuthGuard } from '../../../../src/modules/auth/local/local.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { PrismaClient } from '@prisma/client';
import { PassportModule } from '@nestjs/passport';
import { UserService } from '../../../../src/modules/user/user.service';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { UserMapper } from '../../../../src/modules/auth/dtos/user.mapper';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let prismaClient: PrismaClient;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule.forTest(prismaClient),
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
        UserRepository,
        UserMapper,
        PasswordEncryption,
        AuthService,
        ConfigService,
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    authController = app.get<AuthController>(AuthController);
    authService = app.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login function', () => {
    it('should return logged in user responseDto and jwt token', async () => {
      const req = {
        user: null,
      } as RequestWithUser;

      const res = httpMocks.createResponse();

      req.user = defaultUserResponseDto;

      // Mock call to DB
      const mainSpy = jest
        .spyOn(authService, 'authentication')
        .mockReturnValue(defaultUserResponseDto);

      const response = await authController.login(req, res);

      expect(mainSpy).toHaveBeenCalledTimes(1);
      expect(mainSpy).toHaveBeenCalledWith(req.user, res);
      expect(response._getData()).toStrictEqual({
        message: 'login success',
        data: defaultUserResponseDto,
      });
    });
  });

  describe('register function', () => {
    it('should return a correct responseDto', async () => {
      const res = httpMocks.createResponse();

      // Mock call to DB
      const registerSpy = jest
        .spyOn(authService, 'register')
        .mockResolvedValue(defaultUserResponseDto);
      // Mock call to DB
      const authenticationSpy = jest
        .spyOn(authService, 'authentication')
        .mockReturnValue(defaultUserResponseDto);

      const response = await authController.register(defaultCreateUserDto, res);

      expect(registerSpy).toHaveBeenCalledTimes(1);
      expect(authenticationSpy).toHaveBeenCalledTimes(1);
      expect(registerSpy).toHaveBeenCalledWith(defaultCreateUserDto);
      expect(authenticationSpy).toHaveBeenCalledWith(
        defaultUserResponseDto,
        res,
      );
      expect(response._getData()).toStrictEqual({
        message: 'register success',
        data: defaultUserResponseDto,
      });
    });
  });
});
