import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { CreateUserDto } from '../auth/dtos/createUser.dto';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new user
   * @param createUserDto - The data transfer object containing user creation details
   * @param passwordSalt - The password salt for hashing
   * @returns A promise resolving to the created User object
   */
  async createUser(
    createUserDto: CreateUserDto,
    passwordSalt: string,
  ): Promise<User> {
    try {
      return this.prisma.user.create({
        data: {
          username: createUserDto.username,
          email: createUserDto.email.toLowerCase(),
          password: createUserDto.password,
          passwordSalt: passwordSalt,
          fullName: createUserDto.fullName,
          bio: createUserDto.bio,
          birthdate: createUserDto.birthdate,
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(error.message, error);
    }
  }
}
