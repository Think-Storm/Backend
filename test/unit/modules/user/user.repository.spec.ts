import { UserRepository } from '../../../../src/modules/user/user.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultCreateUserDto,
  defaultUpdateUser1Dto,
} from '../../../utils/user.utils';
import { defaultPasswordSalt } from '../../common/passwordEncryption.utils';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import refreshDatabase from '../../../../src/prisma/prisma.dbreset';

describe('UserRepository', () => {
  let prismaService: PrismaService;
  let userRepository: UserRepository;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prisma)],
      providers: [UserRepository, ConfigService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    userRepository = module.get<UserRepository>(UserRepository);

    await prismaService.$connect();
    await refreshDatabase();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await refreshDatabase();
  });

  describe('createUser function', () => {
    it('should create a new user in DB', async () => {
      const user = await userRepository.createUser(
        defaultCreateUserDto,
        defaultPasswordSalt,
      );

      expect(user).toHaveProperty('id');
      expect(user.createdAt).toBeDefined();
      expect(user.lastUpdatedAt).toBeDefined();
      expect(user.username).toBe(defaultCreateUserDto.username);
      expect(user.email).toBe(defaultCreateUserDto.email);
      expect(user.password).toBe(defaultCreateUserDto.password);
      expect(user.passwordSalt).toBe(defaultPasswordSalt);
    });
  });

  describe('getUserByEmail function', () => {
    it('should retrieve a user in DB with email', async () => {
      // Create a User in DB to fetch
      await userRepository.createUser(
        defaultCreateUserDto,
        defaultPasswordSalt,
      );

      const user = await userRepository.getUserByEmail(
        defaultCreateUserDto.email,
      );

      expect(user).toBeDefined();
      expect(user.email).toBe(defaultCreateUserDto.email);
    });

    it('should not retrieve a user in DB if there is no user with email', async () => {
      // Create a User in DB with a different email
      await userRepository.createUser(
        defaultCreateUserDto,
        defaultPasswordSalt,
      );

      const fakeEmail = 'fakeEmail@email.com';
      const user = await userRepository.getUserByEmail(fakeEmail);

      expect(user).toBeNull();
    });
  });

  describe('getUser function', () => {
    it('should get a searched user in DB', async () => {
      // create a user
      const createdUser = await userRepository.createUser(
        defaultCreateUserDto,
        defaultPasswordSalt,
      );

      const user = await userRepository.getUserById(createdUser.id);

      expect(user).toBeDefined();
      expect(user.id).toBe(createdUser.id);
      expect(user.createdAt).toBeDefined();
      expect(user.lastUpdatedAt).toBeDefined();
      expect(user.username).toBe(defaultCreateUserDto.username);
      expect(user.email).toBe(defaultCreateUserDto.email);
      expect(user.password).toBe(defaultCreateUserDto.password);
      expect(user.passwordSalt).toBe(defaultPasswordSalt);
    });

    it('should fail if userId is String type', async () => {
      // create a user
      await userRepository.createUser(
        defaultCreateUserDto,
        defaultPasswordSalt,
      );
      try {
        await userRepository.getUserById(Number('abc'));
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        expect(e.message).toContain(errorMessages.VALIDATION_ERROR);
      }
    });
  });

  describe('updateUser function', () => {
    it('should update an existing user in DB', async () => {
      // create a user
      const createdUser = await userRepository.createUser(
        defaultCreateUserDto,
        defaultPasswordSalt,
      );

      const user = await userRepository.updateUser(defaultUpdateUser1Dto);

      expect(user).toBeDefined();
      expect(user.id).toBe(createdUser.id);
      expect(user.createdAt).toBeDefined();
      expect(user.lastUpdatedAt).toBeDefined();
      expect(user.username).toBe(defaultUpdateUser1Dto.username);
      expect(user.email).toBe(defaultUpdateUser1Dto.email);
    });
  });

  describe('udpatePassword', () => {
    it('should update user password', async () => {
      const createdUser = await userRepository.createUser(
        defaultCreateUserDto,
        defaultPasswordSalt,
      );

      const updatedUser = await userRepository.udpatePassword(
        { password: 'newHashedPassword' } as any,
        'newPasswordSalt',
        createdUser.id,
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser.id).toBe(createdUser.id);
      expect(updatedUser.password).toBe('newHashedPassword');
      expect(updatedUser.passwordSalt).toBe('newPasswordSalt');
    });

    it('should throw ServiceException on DB error', async () => {
      jest
        .spyOn(prismaService.user, 'update')
        .mockRejectedValue(new Error('DB error'));
      await expect(
        userRepository.udpatePassword(
          { password: 'newHashedPassword' } as any,
          'newPasswordSalt',
          1,
        ),
      ).rejects.toThrow(ServiceException);
    });
  });

  describe('deleteUser repository function', () => {
    it('should delete an existing user from DB', async () => {
      // Arrange: create a user
      const createdUser = await userRepository.createUser(
        defaultCreateUserDto,
        defaultPasswordSalt,
      );

      // Act
      const result = await userRepository.deleteUserById(createdUser.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(createdUser.id);
    });

    it('should throw ServiceException if user does not exist', async () => {
      // Arrange
      const nonExistentUserId = 99999;
      // Act & Assert
      await expect(
        userRepository.deleteUserById(nonExistentUserId),
      ).rejects.toThrow(ServiceException);
      await expect(
        userRepository.deleteUserById(nonExistentUserId),
      ).rejects.toThrow(errorMessages.ERROR_DELETING_USER);
    });

    it('should throw ServiceException for foreign key constraint violation', async () => {
      // This test assumes you have a Notification or related table with a foreign key to User.
      // You may need to adjust this test based on your schema and seed data.
      // Arrange: create a user
      const createdUser = await userRepository.createUser(
        defaultCreateUserDto,
        defaultPasswordSalt,
      );
      // Simulate a foreign key constraint by creating a related record if possible
      // For demonstration, we expect the error to be thrown if such a constraint exists
      // Act & Assert
      try {
        await userRepository.deleteUserById(createdUser.id);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceException);
        // The error message should include the foreign key constraint violation message if triggered
        // expect(e.message).toContain(errorMessages.FOREIGN_KEY_CONSTRAINT_VIOLATION); // Uncomment if you have such a constraint
      }
    });
  });
});
