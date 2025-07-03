import { User } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserResponseDto } from '../../src/modules/user/dtos/userResponse.dto';
import { CreateUserDto } from '../../src/modules/user/dtos/createUser.dto';
import { UserRepository } from '../../src/modules/user/user.repository';
import { defaultPasswordSalt } from '../unit/common/passwordEncryption.utils';
import { UpdateUserDto } from '../../src/modules/user/dtos/updateUser.dto';

export const loginUserDto = {
  email: 'email@email.com',
  password: 'hashedPassword',
};

export const defaultCreateUserDto: CreateUserDto = {
  username: 'username',
  email: 'email@email.com',
  password: 'hashedPassword',
};

export const defaultUserResponseDto: UserResponseDto = {
  id: 1,
  email: 'email@email.com',
  username: 'username',
  password: 'hashedPassword',
  passwordChangedAt: null,
  createdAt: new Date('2000-01-01'),
  lastUpdatedAt: new Date('2000-01-01'),
};

export const defaultUser: User = {
  id: 1,
  email: 'email@email.com',
  username: 'username',
  password: 'hashedPassword',
  passwordSalt: 'passwordsalt',
  passwordChangedAt: null,
  createdAt: new Date('2000-01-01'),
  lastUpdatedAt: new Date('2000-01-01'),
};

export const defaultUserWithoutSensitiveData = {
  id: 1,
  email: 'email@email.com',
  username: 'username',
  createdAt: new Date('2000-01-01'),
  lastUpdatedAt: new Date('2000-01-01'),
};

export const createUserInDB = async (
  prismaService: PrismaService,
  defaultCreateUserDto: CreateUserDto,
): Promise<User> => {
  const userRepository = new UserRepository(prismaService);
  return await userRepository.createUser(
    defaultCreateUserDto,
    defaultPasswordSalt,
  );
};

export const defaultUpdateUser1Dto: UpdateUserDto = {
  id: 1,
  username: 'username1',
  email: 'email@email.com',
};

export const defaultUpdateUser2Dto: UpdateUserDto = {
  id: 2,
  username: 'username2',
  email: 'email2@email.com',
};
