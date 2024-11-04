import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import { ServiceException } from '../../common/exception-filter/serviceException';

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
   *
   * @param userId - User id for getting user object
   * @returns A promise resolving to the found User object
   */
  async getUserById(userId: number): Promise<User> {
    try {
      return await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(error.message, error);
    }
  }
}
