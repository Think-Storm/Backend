import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../../src/modules/user/user.service';
import { defaultUser } from '../user/user.utils';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { PasswordEncryption } from '../../../../src/common/passwordEncryption';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { UserController } from '../../../../src/modules/user/user.controller';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { AuthRepository } from '../../../../src/modules/auth/auth.repository';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: UserRepository;
  let passwordEncryption: PasswordEncryption;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        UserRepository,
        PasswordEncryption,
        UserMapper,
        PrismaService,
        AuthService,
        AuthRepository,
        JwtService,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    passwordEncryption = module.get<PasswordEncryption>(PasswordEncryption);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkUserAndPassword function', () => {
    it('should return user with right email and password', async () => {
      // Mock call to DB to return a User
      const emailCheckSpy = jest
        .spyOn(userRepository, 'getUserByEmail')
        .mockResolvedValue(defaultUser);

      const passwordCheckSpy = jest
        .spyOn(passwordEncryption, 'correctPassword')
        .mockResolvedValue(true);

      expect(
        await authService.checkUserAndPassword(
          defaultUser.email,
          defaultUser.password,
        ),
      ).toBe(defaultUser);

      expect(emailCheckSpy).toHaveBeenCalledTimes(1);
      expect(passwordCheckSpy).toHaveBeenCalledTimes(1);
      expect(passwordCheckSpy).toBeTruthy();
    });

    it('should return 401 error if user does not exist', async () => {
      // Mock call to DB to return a User
      const emailCheckSpy = jest
        .spyOn(userRepository, 'getUserByEmail')
        .mockResolvedValue(undefined);

      try {
        await authService.checkUserAndPassword(
          defaultUser.email,
          defaultUser.password,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toEqual(errorMessages.INCORRECT_EMAIL_OR_PASSWORD);
      }

      expect(emailCheckSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw 401 error with incorrect password', async () => {
      // Mock call to DB not to return a User
      const emailCheckSpy = jest
        .spyOn(userRepository, 'getUserByEmail')
        .mockResolvedValue(defaultUser);

      const passwordCheckSpy = jest
        .spyOn(passwordEncryption, 'correctPassword')
        .mockResolvedValue(false);

      try {
        await authService.checkUserAndPassword(
          defaultUser.email,
          defaultUser.password,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toEqual(errorMessages.INCORRECT_EMAIL_OR_PASSWORD);
      }

      expect(emailCheckSpy).toHaveBeenCalledTimes(1);
      expect(passwordCheckSpy).toHaveBeenCalledTimes(1);
      // expect(passwordCheckSpy).toBeFalsy();
    });
  });
});
