/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const httpMocks = require('node-mocks-http');
import { JwtModule } from '@nestjs/jwt';
import {
  defaultCreateUserDto,
  defaultUser,
  defaultUserResponseDto,
} from '../../../utils/user.utils';
import { AuthController } from '../../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { LocalAuthGuard } from '../../../../src/modules/auth/local/local.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import prisma from '../../../../src/prisma/prisma.client';
import { PassportModule } from '@nestjs/passport';
import { UserService } from '../../../../src/modules/user/user.service';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { JwtStrategy } from '../../../../src/modules/auth/jwt/jwt.strategy';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { PasswordEncryption } from '../../../../src/common/encryption/passwordEncryption';
import { NotificationService } from '../../../../src/modules/notification/notification.service';
import { NotificationRepository } from '../../../../src/modules/notification/notification.repository';
import { JwtHelperService } from '../../../../src/modules/auth/jwt/jwt-helper.service';
import { MailService } from '../../../../src/modules/mail/mail.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let jwtStrategy: JwtStrategy;
  let jwtHelperService: JwtHelperService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
        NotificationService,
        NotificationRepository,
        UserRepository,
        PasswordEncryption,
        UserMapper,
        AuthService,
        ConfigService,
        JwtStrategy,
        JwtHelperService,
        MailService,
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    jwtHelperService = module.get<JwtHelperService>(JwtHelperService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login function', () => {
    it('should return logged in user responseDto and jwt token', async () => {
      const res = httpMocks.createResponse();

      const authSpy = jest
        .spyOn(authService, 'authentication')
        .mockReturnValue(defaultUserResponseDto);

      const response = await authController.login(defaultUserResponseDto, res);

      expect(authSpy).toHaveBeenCalledWith(defaultUserResponseDto, res);
      expect(response._getData()).toEqual({
        message: 'login success',
        data: defaultUserResponseDto,
      });
    });

    it('should handle unauthorized access', async () => {
      const res = httpMocks.createResponse();

      jest.spyOn(authService, 'authentication').mockImplementation(() => {
        throw ServiceException.UnAuthorizedException(
          errorMessages.INCORRECT_EMAIL_OR_PASSWORD,
        );
      });

      await expect(authController.login(null, res)).rejects.toThrow(
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

  describe('logout function', () => {
    let res: any;

    beforeEach(() => {
      res = httpMocks.createResponse();
      jest.clearAllMocks();

      // Mock AuthService
      jest.spyOn(authService, 'logout').mockResolvedValue({
        token: '',
        path: '/',
        httpOnly: true,
        maxAge: 0,
      });
    });

    it('should handle missing token', async () => {
      const req = httpMocks.createRequest();

      // Mock JwtStrategy to throw error
      const error = ServiceException.UnAuthorizedException(
        errorMessages.PROTECT_ROUTES,
      );
      jest
        .spyOn(jwtHelperService, 'checkTokenExists')
        .mockImplementation(() => {
          throw error;
        });

      try {
        await jwtStrategy.validate(req);
        await authController.logout(res);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toBe(errorMessages.PROTECT_ROUTES);
      }

      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('should handle expired token', async () => {
      const req = httpMocks.createRequest();
      const error = ServiceException.UnAuthorizedException(
        errorMessages.TOKEN_EXPIRED,
      );

      jest
        .spyOn(jwtHelperService, 'checkTokenExists')
        .mockReturnValue('expired-token');
      jest
        .spyOn(jwtHelperService, 'verifyAndDecodeToken')
        .mockImplementation(() => {
          throw error;
        });

      try {
        await jwtStrategy.validate(req);
        await authController.logout(res);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toBe(errorMessages.TOKEN_EXPIRED);
      }

      expect(jwtHelperService.checkTokenExists).toHaveBeenCalled();
      expect(jwtHelperService.verifyAndDecodeToken).toHaveBeenCalledWith(
        'expired-token',
      );
      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('should handle non-existent user', async () => {
      const req = httpMocks.createRequest();
      const error = ServiceException.UnAuthorizedException(
        errorMessages.ENTITY_NOT_FOUND('User', '9999'),
      );

      jest
        .spyOn(jwtHelperService, 'checkTokenExists')
        .mockReturnValue('valid-token');
      jest
        .spyOn(jwtHelperService, 'verifyAndDecodeToken')
        .mockResolvedValue({ id: 9999 });
      jest
        .spyOn(jwtHelperService, 'checkUserExistsInDB')
        .mockImplementation(() => {
          throw error;
        });

      try {
        await jwtStrategy.validate(req);
        await authController.logout(res);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toBe(errorMessages.ENTITY_NOT_FOUND('User', '9999'));
      }

      expect(jwtHelperService.checkTokenExists).toHaveBeenCalled();
      expect(jwtHelperService.verifyAndDecodeToken).toHaveBeenCalledWith(
        'valid-token',
      );
      expect(jwtHelperService.checkUserExistsInDB).toHaveBeenCalledWith(9999);
      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('should handle password changed scenario', async () => {
      const req = httpMocks.createRequest();
      const error = ServiceException.UnAuthorizedException(
        errorMessages.USER_CHANGED_PASSWORD,
      );

      jest
        .spyOn(jwtHelperService, 'checkTokenExists')
        .mockReturnValue('valid-token');
      jest.spyOn(jwtHelperService, 'verifyAndDecodeToken').mockResolvedValue({
        id: defaultUser.id,
        iat: Date.now() / 1000,
      });
      jest
        .spyOn(jwtHelperService, 'checkUserExistsInDB')
        .mockResolvedValue(defaultUser);
      jest
        .spyOn(jwtHelperService, 'checkUserPasswordChanged')
        .mockImplementation(() => {
          throw error;
        });

      try {
        await jwtStrategy.validate(req);
        await authController.logout(res);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toBe(errorMessages.USER_CHANGED_PASSWORD);
      }

      expect(jwtHelperService.checkTokenExists).toHaveBeenCalledTimes(1);
      expect(jwtHelperService.verifyAndDecodeToken).toHaveBeenCalledWith(
        'valid-token',
      );
      expect(jwtHelperService.checkUserExistsInDB).toHaveBeenCalled();
      expect(jwtHelperService.checkUserPasswordChanged).toHaveBeenCalled();
      expect(authService.logout).not.toHaveBeenCalled();
    });
  });

  afterAll(() => {
    jest.resetAllMocks();
  });
});
