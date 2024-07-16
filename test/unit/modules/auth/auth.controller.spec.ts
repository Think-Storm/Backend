import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const httpMocks = require('node-mocks-http');
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { PasswordEncryption } from '../../../../src/common/passwordEncryption';
import { defaultUserResponseDto } from '../user/user.utils';
import { AuthController } from '../../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import RequestWithUser from '../../../../src/modules/auth/local/requestWithUser.interface';
import { LocalAuthGuard } from '../../../../src/modules/auth/local/local.guard';
import { AuthRepository } from '../../../../src/modules/auth/auth.repository';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { PrismaClient } from '@prisma/client';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let prismaClient: PrismaClient;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prismaClient)],
      controllers: [AuthController],
      providers: [
        AuthService,
        AuthRepository,
        UserRepository,
        UserMapper,
        PasswordEncryption,
        JwtService,
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
        message: 'success',
        data: defaultUserResponseDto,
      });
    });

    // it('should throw 400 error without email field', async () => {
    //   const req = {
    //     user: null,
    //   } as RequestWithUser;

    //   const res = httpMocks.createResponse();

    //   req.body = {
    //     password: defaultUser.password,
    //   };

    //   // Mock call to DB not to return a User
    //   const mainSpy = jest
    //     .spyOn(authService, 'authentication')
    //     .mockReturnValue(null);

    //   await expect(async () => {
    //     await authController.login(req, res);
    //   }).rejects.toThrow(
    //     ServiceException.BadRequestException(
    //       errorMessages.BAD_REQUEST_LOGIN_ERROR,
    //     ),
    //   );

    //   expect(mainSpy).toHaveBeenCalledTimes(0);
    // });

    // it('should throw 400 error without password field', async () => {
    //   const req = {
    //     user: null,
    //   } as RequestWithUser;

    //   const res = httpMocks.createResponse();
    //   req.body = {
    //     email: defaultUser.email,
    //   };

    //   // Mock call to DB not to return a User
    //   const mainSpy = jest
    //     .spyOn(authService, 'authentication')
    //     .mockReturnValue(null);

    //   await expect(async () => {
    //     await authController.login(req, res);
    //   }).rejects.toThrow(
    //     ServiceException.BadRequestException(
    //       errorMessages.BAD_REQUEST_LOGIN_ERROR,
    //     ),
    //   );

    //   expect(mainSpy).toHaveBeenCalledTimes(0);
    // });
  });
});
