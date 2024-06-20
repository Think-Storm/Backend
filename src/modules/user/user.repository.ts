import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateUserDto } from './dtos/createUser.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a user by email
   * @param email - The email of the user to find
   * @returns A promise resolving to a User object or null
   */
  async getUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: email.toLowerCase(),
        },
      },
    });
  }

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
  }

  async getUser(userId: number): Promise<User> {
    return await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }
}
