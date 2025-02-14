import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../../../src/modules/user/user.controller';
import { UserService } from '../../../../src/modules/user/user.service';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { PasswordEncryption } from '../../../../src/common/encryption/passwordEncryption';
import { defaultUserResponseDto } from '../../../utils/user.utils';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import prisma from '../../../../src/prisma/prisma.client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prisma)],
      controllers: [UserController],
      providers: [
        UserService,
        UserRepository,
        UserMapper,
        PasswordEncryption,
        JwtService,
        ConfigService,
      ],
    }).compile();

    userController = app.get<UserController>(UserController);
    userService = app.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUser function', () => {
    it('should return a searched user responseDto', async () => {
      // Mock call to DB
      const mainSpy = jest
        .spyOn(userService, 'getUserById')
        .mockResolvedValue(defaultUserResponseDto);

      const response = await userController.getUserById(
        defaultUserResponseDto.id,
      );

      expect(mainSpy).toHaveBeenCalledTimes(1);
      expect(mainSpy).toHaveBeenCalledWith(defaultUserResponseDto.id);
      expect(response).toBe(defaultUserResponseDto);
    });
  });
});
