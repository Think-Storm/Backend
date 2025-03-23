import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { CreateUserDto } from '../user/dtos/createUser.dto';
import { errorMessages } from '../../common/enums/errorMessages';
import { UpdateUserDto } from '../user/dtos/updateUser.dto';
import { CreateUserProfileDto } from '../user/dtos/createUserProfile.dto';
import { UserProfile } from '@prisma/client';

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
          fullName: createUserDto.fullName,
          birthdate: createUserDto.birthdate,
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
   * @param passwordSalt - The password salt for hashing
   * @returns A promise resolving to the updated User object
   */
  async updateUser(
    updateUserDto: UpdateUserDto,
    passwordSalt: string,
  ): Promise<User> {
    try {
      return await this.prisma.user.update({
        data: {
          username: updateUserDto.username,
          email: updateUserDto.email.toLowerCase(),
          password: updateUserDto.password,
          passwordSalt: passwordSalt,
          fullName: updateUserDto.fullName,
          birthdate: updateUserDto.birthdate,
          lastUpdatedAt: new Date(),
          passwordChangedAt: new Date(),
        },
        omit: {
          password: false,
        },
        where: {
          id: updateUserDto.id,
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(error.message, error);
    }
  }

  async createUserProfile(
    userId: number,
    createProfileDto: CreateUserProfileDto,
  ): Promise<UserProfile> {
    const {
      domain_labels,
      languages,
      technical_labels,
      preferred_role,
      ...profileData
    } = createProfileDto;

    return await this.prisma.userProfile.create({
      data: {
        ...profileData,
        preferedRole: preferred_role,
        userId,
        interests: domain_labels
          ? {
              create: domain_labels.map((label) => ({
                label: {
                  connectOrCreate: {
                    where: { name: label },
                    create: { name: label },
                  },
                },
              })),
            }
          : undefined,
        languages: languages
          ? {
              create: languages.map((code) => ({
                language: {
                  connect: { code },
                },
              })),
            }
          : undefined,
        skills: technical_labels
          ? {
              create: technical_labels.map((label) => ({
                label: {
                  connectOrCreate: {
                    where: { name: label },
                    create: { name: label },
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        interests: {
          include: {
            label: true,
          },
        },
        languages: {
          include: {
            language: true,
          },
        },
        skills: {
          include: {
            label: true,
          },
        },
        role: true,
      },
    });
  }

  /**
   * Get user profile by user ID
   * @param userId - ID of the user
   * @returns User profile if exists, null otherwise
   */
  async getUserProfileByUserId(userId: number): Promise<UserProfile | null> {
    return await this.prisma.userProfile.findUnique({
      where: {
        userId: userId,
      },
    });
  }
}
