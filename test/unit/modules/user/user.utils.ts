import { User } from '@prisma/client';
import { CreateUserDto } from '../../../../src/modules/user/dtos/createUser.dto';
import { UserResponseDto } from '../../../../src/modules/user/dtos/userResponse.dto';

export const defaultCreateUserDto: CreateUserDto = {
  username: 'username',
  fullName: 'Full Name',
  email: 'email@email.com',
  password: 'hashedPassword',
  birthdate: new Date('2000-01-01'),
  bio: 'bio',
};

export const defaultUserResponseDto: UserResponseDto = {
  id: 0,
  username: 'username',
  fullName: 'Full Name',
  email: 'email@email.com',
  birthdate: new Date('2000-01-01'),
  bio: 'bio',
  avatar: 'avatar',
  createdAt: new Date('2000-01-01'),
  lastUpdatedAt: new Date('2000-01-01'),
};

export const defaultUser: User = {
  id: 1,
  email: 'email@email.com',
  username: 'username',
  password: 'hashedPassword',
  passwordSalt: 'passwordsalt',
  fullName: 'Full Name',
  birthdate: new Date('2000-01-01'),
  avatar: 'avatar',
  bio: 'bio',
  createdAt: new Date('2000-01-01'),
  lastUpdatedAt: new Date('2000-01-01'),
};
