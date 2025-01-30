import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../../src/modules/user/user.service';
import {
  defaultCreateUserDto,
  defaultUser,
  defaultUpdateUser1Dto,
  defaultUserResponseDto,
  defaultUpdateUser2Dto,
} from '../../../utils/user.utils';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { PasswordEncryption } from '../../../../src/common/encryption/passwordEncryption';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { UserController } from '../../../../src/modules/user/user.controller';
import { JwtService } from '@nestjs/jwt';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import prisma from '../../../../src/prisma/prisma.client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import refreshDatabase from '../../../../src/prisma/prisma.dbreset';
import { UserResponseDto } from '../../../../src/modules/user/dtos/userResponse.dto';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { defaultPasswordSalt } from '../../../../test/unit/common/passwordEncryption.utils';
import { NotificationRepository } from '../../../../src/modules/notification/notification.repository';
import { NotificationService } from '../../../../src/modules/notification/notification.service';

describe('UserService', () => {
  let authService: AuthService;
  let userService: UserService;
  let userRepository: UserRepository;
  let passwordEncryption: PasswordEncryption;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prisma)],
      controllers: [UserController],
      providers: [
        AuthService,
        UserService,
        UserRepository,
        PasswordEncryption,
        UserMapper,
        JwtService,
        ConfigService,
        NotificationService,
        NotificationRepository,
      ],
    })
      .overrideInterceptor(ClassSerializerInterceptor)
      .useClass(ClassSerializerInterceptor)
      .compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    passwordEncryption = module.get<PasswordEncryption>(PasswordEncryption);
  });

  beforeEach(async () => {
    await refreshDatabase();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await refreshDatabase();
  });

  describe('getUser function', () => {
    it('should get user by userId and return a correct UserResponseDto', async () => {
      // create User
      await authService.register(defaultCreateUserDto);
      // Mock call to DB
      const successDbSpy = jest
        .spyOn(userRepository, 'getUserById')
        .mockResolvedValue(defaultUser);

      const successUserResponseDto = await userService.getUserById(
        defaultUser.id,
      );

      const expectedResponseDto = defaultUserResponseDto;

      expect(successDbSpy).toHaveBeenCalledTimes(1);
      expect(successUserResponseDto).toEqual(expectedResponseDto);
    });
  });

  describe('updateUserById function', () => {
    it('should send the newly modified user data with the user id and return a correct UserResponseDto', async () => {
      // create User
      await authService.register(defaultCreateUserDto);

      const expectedResponseDto: UserResponseDto = {
        ...defaultUpdateUser1Dto,
        createdAt: defaultUser.createdAt,
        lastUpdatedAt: defaultUser.lastUpdatedAt,
      };

      // Mock call to DB not to return a User
      const spy = jest
        .spyOn(userRepository, 'getUserById')
        .mockResolvedValue(defaultUser);

      // Mock call to DB
      const successDbSpy = jest
        .spyOn(userRepository, 'updateUser')
        .mockResolvedValue({
          ...defaultUser,
          ...expectedResponseDto, // Ensure the mock value matches the expected response
        });

      const passwordSaltSpy = jest
        .spyOn(passwordEncryption, 'createSaltAndHashedPassword')
        .mockResolvedValue({
          passwordSalt: defaultPasswordSalt,
          hashedPassword: 'hashedPassword',
        });

      const successUserResponseDto = await userService.updateUserById(
        defaultUpdateUser1Dto,
        defaultUser.id,
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(successDbSpy).toHaveBeenCalledTimes(1);
      expect(successDbSpy).toHaveBeenCalledWith(
        defaultUpdateUser1Dto,
        defaultPasswordSalt,
      );
      expect(passwordSaltSpy).toHaveBeenCalledTimes(1);
      expect(successUserResponseDto).toEqual(expectedResponseDto);
    });

    it('should throw an 404 exception if user with id is not found', async () => {
      // Mock call to DB not to return a User
      const spy = jest
        .spyOn(userRepository, 'getUserById')
        .mockResolvedValue(null);

      try {
        await userService.updateUserById(defaultUpdateUser1Dto, defaultUser.id);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toContain(
          errorMessages.ENTITY_NOT_FOUND(
            'User',
            defaultUpdateUser1Dto.id.toString(),
          ),
        );
      }

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(defaultUpdateUser1Dto.id);
    });

    it('should throw an 403 exception if the user is not the owner of the project', async () => {
      // Mock call to DB to return a User
      const spy = jest
        .spyOn(userRepository, 'getUserById')
        .mockResolvedValue(defaultUser);

      try {
        await userService.updateUserById(defaultUpdateUser1Dto, 999);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toContain(
          errorMessages.FORBIDDEN('You are not the owner of this account'),
        );
      }

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(defaultUpdateUser1Dto.id);
    });
  });

  it('should throw an 400 exception if user tries to update exist email', async () => {
    // create User
    await authService.register(defaultCreateUserDto);

    // create User with email that has same email with defaultUpdateUser2Dto
    await authService.register({
      ...defaultCreateUserDto,
      email: defaultUpdateUser2Dto.email,
    });

    // Mock call to DB not to return a User
    const spy = jest
      .spyOn(userRepository, 'getUserById')
      .mockResolvedValue(defaultUser);

    try {
      await userService.updateUserById(
        { ...defaultUpdateUser2Dto, id: defaultUser.id },
        defaultUser.id,
      );
    } catch (e) {
      expect(e).toBeInstanceOf(ServiceException);
      expect(e.message).toContain(errorMessages.USER_WITH_EMAIL_ALREADY_EXISTS);
    }

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(defaultUpdateUser1Dto.id);
  });
});
