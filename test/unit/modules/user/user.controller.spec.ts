import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../../../src/modules/user/user.controller';
import { UserService } from '../../../../src/modules/user/user.service';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { PasswordEncryption } from '../../../../src/common/passwordEncryption';
import { defaultCreateUserDto, defaultUserResponseDto } from './user.utils';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        UserRepository,
        PrismaService,
        UserMapper,
        PasswordEncryption,
      ],
    }).compile();

    userController = app.get<UserController>(UserController);
    userService = app.get<UserService>(UserService);
  });

  describe('createUser function', () => {
    it('should return a correct responseDto', async () => {
      // Mock call to Dto validator
      const validatorSpy = jest.spyOn(userService, 'IsUserCreateDtoValid');

      // Mock call to DB
      const mainSpy = jest
        .spyOn(userService, 'createUser')
        .mockResolvedValue(defaultUserResponseDto);
      userService;

      const response = await userController.createUser(defaultCreateUserDto);

      expect(validatorSpy).toHaveBeenCalledTimes(1);
      expect(mainSpy).toHaveBeenCalledTimes(1);
      expect(mainSpy).toHaveBeenCalledWith(defaultCreateUserDto);
      expect(response).toBe(defaultUserResponseDto);
    });
  });
});
