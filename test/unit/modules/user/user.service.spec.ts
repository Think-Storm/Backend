import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../../src/modules/user/user.service';
import { defaultCreateUserDto, defaultUser } from './user.utils';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { PasswordEncryption } from '../../../../src/common/passwordEncryption';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { UserController } from '../../../../src/modules/user/user.controller';
import { PrismaService } from '../../../../src/prisma/prisma.service';
// import { BadRequestException } from '@nestjs/common';
import { defaultSaltAndPassword } from '../../common/passwordEncryption.utils';
import { UserResponseDto } from '../../../../src/modules/user/dtos/userResponse.dto';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';

describe('UserService', () => {
  let userService: UserService;
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
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    passwordEncryption = module.get<PasswordEncryption>(PasswordEncryption);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('IsUserCreateDtoValid function', () => {
    it('should throw an exception if user already exists with email', async () => {
      // Mock call to DB to return a User
      const spy = jest
        .spyOn(userRepository, 'getUserByEmail')
        .mockResolvedValue(defaultUser);

      expect(
        userService.IsUserCreateDtoValid(defaultCreateUserDto),
      ).rejects.toThrow(ServiceException);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not throw an exception if no user exists with email', async () => {
      // Mock call to DB not to return a User
      const spy = jest
        .spyOn(userRepository, 'getUserByEmail')
        .mockResolvedValue(null);

      expect(() =>
        userService.IsUserCreateDtoValid(defaultCreateUserDto),
      ).not.toThrow();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('createUser function', () => {
    it('should create user and map the result into UserResponseDto', async () => {
      // Mock call to the password and salt creation
      const passwordSpy = jest
        .spyOn(passwordEncryption, 'createSaltAndHashedPassword')
        .mockResolvedValue(defaultSaltAndPassword);

      // Mock call to DB
      const dbSpy = jest
        .spyOn(userRepository, 'createUser')
        .mockResolvedValue(defaultUser);

      const expectedResponseDto: UserResponseDto = {
        id: defaultUser.id,
        email: defaultUser.email,
        username: defaultUser.username,
        fullName: defaultUser.fullName,
        birthdate: defaultUser.birthdate,
        avatar: defaultUser.avatar,
        bio: defaultUser.bio,
        createdAt: defaultUser.createdAt,
        lastUpdatedAt: defaultUser.lastUpdatedAt,
      };

      const userResponseDto =
        await userService.createUser(defaultCreateUserDto);

      // Checking the mapper
      expect(userResponseDto).toEqual(expectedResponseDto);
      expect(userResponseDto).not.toHaveProperty('password');
      expect(userResponseDto).not.toHaveProperty('passwordSalt');

      expect(passwordSpy).toHaveBeenCalledTimes(1);

      expect(dbSpy).toHaveBeenCalledTimes(1);
      expect(dbSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          password: defaultSaltAndPassword.hashedPassword,
        }),
        defaultSaltAndPassword.passwordSalt,
      );
    });
  });

  describe('getUser function', () => {
    it('should get user by userId and return a correct UserResponseDto', async () => {
      // create User
      await userService.createUser(defaultCreateUserDto);

      // Mock call to DB
      const successDbSpy = jest
        .spyOn(userRepository, 'getUser')
        .mockResolvedValue(defaultUser);

      const successUserResponseDto = await userService.getUser(1);

      const expectedResponseDto: UserResponseDto = {
        id: defaultUser.id,
        email: defaultUser.email,
        username: defaultUser.username,
        fullName: defaultUser.fullName,
        birthdate: defaultUser.birthdate,
        avatar: defaultUser.avatar,
        bio: defaultUser.bio,
        createdAt: defaultUser.createdAt,
        lastUpdatedAt: defaultUser.lastUpdatedAt,
      };

      expect(successDbSpy).toHaveBeenCalledTimes(1);
      expect(successUserResponseDto).toEqual(expectedResponseDto);
    });
    it('should throw 404 error if user is not found', async () => {
      // create User
      await userService.createUser(defaultCreateUserDto);

      try {
        await userService.getUser(999);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toEqual(errorMessages.ENTITY_NOT_FOUND);
      }
    });
  });
});
