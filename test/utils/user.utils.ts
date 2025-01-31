import { User } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserResponseDto } from '../../src/modules/user/dtos/userResponse.dto';
import { CreateUserDto } from '../../src/modules/user/dtos/createUser.dto';
import { UserRepository } from '../../src/modules/user/user.repository';
import { defaultPasswordSalt } from '../unit/common/passwordEncryption.utils';

export const defaultCreateUserDto: CreateUserDto = {
  username: 'username',
  fullName: 'Full Name',
  email: 'email@email.com',
  password: 'hashedPassword',
  birthdate: new Date('2000-01-01'),
};

export const defaultUserResponseDto: UserResponseDto = {
  id: 1,
  email: 'email@email.com',
  username: 'username',
  fullName: 'Full Name',
  password: 'hashedPassword',
  birthdate: new Date('2000-01-01'),
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
  fullName: 'Full Name',
  birthdate: new Date('2000-01-01'),
  createdAt: new Date('2000-01-01'),
  lastUpdatedAt: new Date('2000-01-01'),
};

export const createUserInDB = async (
  prismaService: PrismaService,
  defaultCreateUserDto: CreateUserDto,
): Promise<User> => {
  const userRepository = new UserRepository(prismaService);
  return userRepository.createUser(defaultCreateUserDto, defaultPasswordSalt);
};
