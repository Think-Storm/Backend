import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { CreateUserDto } from '../user/dtos/createUser.dto';
import { errorMessages } from '../../common/enums/errorMessages';
import { UpdateUserDto } from '../user/dtos/updateUser.dto';
import { UpdatePasswordDto } from '../auth/dtos/updatePassword.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Finds a user by email
   * @param email - The email of the user to find
   * @returns A promise resolving to a User object or null
   */
  async getUserByEmail(email: string): Promise<User> {
    try {
      return await this.prisma.user.findFirst({
        where: {
          email: {
            equals: email.toLowerCase(),
          },
        },
        omit: {
          password: false,
          passwordChangedAt: false,
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_GETTING_USER_BY_EMAIL,
        error,
      );
    }
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
        omit: {
          passwordChangedAt: false,
        },
        include: {
          savedProjects: {
            include: {
              project: true,
            },
          },
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_GETTING_USER_BY_ID,
        error,
      );
    }
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
    try {
      return await this.prisma.user.create({
        data: {
          username: createUserDto.username,
          email: createUserDto.email.toLowerCase(),
          password: createUserDto.password,
          passwordSalt: passwordSalt,
        },
        include: {
          founded_projects: true,
          projects: true,
          like: true,
          involvement: true,
          joinRequest: true,
          userProfile: true,
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_CREATING_USER,
        error,
      );
    }
  }

  /**
   * Update an existing user
   * @param UpdateUserDto - The data transfer object containing user updating details
   * @returns A promise resolving to the updated User object
   */
  async updateUser(updateUserDto: UpdateUserDto): Promise<User> {
    try {
      return await this.prisma.user.update({
        data: {
          username: updateUserDto.username,
          email: updateUserDto.email.toLowerCase(),
          lastUpdatedAt: new Date(),
        },
        where: {
          id: updateUserDto.id,
        },
        include: {
          savedProjects: true,
          founded_projects: true,
          projects: true,
          like: true,
          involvement: true,
          joinRequest: true,
          userProfile: true,
          notifications: true,
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_UPDATING_USER,
        error,
      );
    }
  }

  /**
   * Update an existing user password
   * @param UpdatePasswordDto - The data transfer object containing user password
   * @param passwordSalt - The password salt for hashing
   * @param userId - The ID of the user to update
   * @returns A promise resolving to the updated User object
   */
  async udpatePassword(
    updateUserDto: UpdatePasswordDto,
    passwordSalt: string,
    userId: number,
  ): Promise<User> {
    try {
      return await this.prisma.user.update({
        data: {
          password: updateUserDto.password,
          passwordSalt: passwordSalt,
          lastUpdatedAt: new Date(),
          passwordChangedAt: new Date(),
        },
        omit: {
          passwordChangedAt: false,
        },
        where: {
          id: userId,
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_UPDATING_PASSWORD_USER,
        error,
      );
    }
  }

  /**
   * Finds a user by user id
   * @param userId - The id of the user to find
   */
  async deleteUserById(userId: number) {
    try {
      return await this.prisma.user.delete({
        where: {
          id: userId,
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_DELETING_USER,
        error,
      );
    }
  }
}
