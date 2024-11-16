import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../../src/modules/user/user.service';
import { defaultCreateUserDto, defaultUser } from './user.utils';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { PasswordEncryption } from '../../../../src/common/passwordEncryption';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { UserController } from '../../../../src/modules/user/user.controller';
import { JwtService } from '@nestjs/jwt';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { AuthService } from '../../../../src/modules/auth/auth.service';

describe('UserService', () => {
  let authService: AuthService;
  let userService: UserService;
  let userRepository: UserRepository;
  const prismaClient = new PrismaClient();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prismaClient)],
      controllers: [UserController],
      providers: [
        AuthService,
        UserService,
        UserRepository,
        PasswordEncryption,
        UserMapper,
        JwtService,
        ConfigService,
      ],
    })
      .overrideInterceptor(ClassSerializerInterceptor)
      .useClass(ClassSerializerInterceptor)
      .compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUser function', () => {
    it('should get user by userId and return a correct UserResponseDto', async () => {
      // create User
      await authService.register(defaultCreateUserDto);

      // Mock call to DB
      const successDbSpy = jest
        .spyOn(userRepository, 'getUserById')
        .mockResolvedValue(defaultUser);

      const successUserResponseDto = await userService.getUserById(1);

      const expectedResponseDto = {
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
  });
});
