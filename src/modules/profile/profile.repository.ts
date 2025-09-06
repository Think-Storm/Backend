import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserProfile } from '@prisma/client';
import { CreateUserProfileDto } from './dtos/createUserProfile.dto';
import { UpdateUserProfileDto } from './dtos/updateUserProfile.dto';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { errorMessages } from '../../common/enums/errorMessages';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new user profile with associated domain interests, languages, and technical skills
   * @param userId - The ID of the user to create the profile for
   * @param createProfileDto - Data transfer object containing profile information
   * @param createProfileDto.domain_labels - Array of domain/interest areas (e.g., "AI", "Web Development")
   * @param createProfileDto.languages - Array of language names the user knows
   * @param createProfileDto.technical_labels - Array of technical skills/technologies
   * @param createProfileDto.preferred_role - User's preferred role in projects
   * @param createProfileDto.profileData - Additional profile data (spread from remaining DTO fields)
   * @returns Promise resolving to the created UserProfile with all related entities included
   *
   * The method handles:
   * - Creating or connecting domain labels for user interests
   * - Connecting existing language records
   * - Creating or connecting technical skill labels
   * - All relations are created in a single transaction
   */
  async createUserProfile(
    userId: number,
    createProfileDto: CreateUserProfileDto,
  ): Promise<UserProfile> {
    const {
      domain_labels,
      languages,
      technical_labels,
      preferred_role,
      website,
      websiteType,
      ...profileData
    } = createProfileDto;

    try {
      return await this.prisma.userProfile.create({
        data: {
          ...profileData,
          userId,
          website: {
            set: website,
          },
          websiteType: {
            set: websiteType,
          },
          preferredRole: preferred_role
            ? {
                create: preferred_role.map((roleName) => ({
                  roleName,
                })),
              }
            : undefined,
          interests: domain_labels
            ? {
                create: domain_labels.map((labelName) => ({
                  labelName,
                })),
              }
            : undefined,
          languages: languages
            ? {
                create: languages.map((name) => ({
                  language: {
                    connect: { name },
                  },
                })),
              }
            : undefined,
          skills: technical_labels
            ? {
                create: technical_labels.map((labelName) => ({
                  labelName,
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
          preferredRole: {
            include: {
              role: true,
            },
          },
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_CREATING_USER_IN_DB,
        error,
      );
    }
  }

  /**
   * Get user profile by user ID
   * @param userId - ID of the user
   * @returns User profile if exists, null otherwise
   */
  async getUserProfileByUserId(userId: number): Promise<UserProfile | null> {
    try {
      return await this.prisma.userProfile.findUnique({
        where: {
          userId: userId,
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
   * Get user profile by profile ID
   * @param profileId - ID of the profile
   * @returns User profile if exists, null otherwise
   */
  async getProfileById(profileId: number): Promise<UserProfile | null> {
    try {
      return await this.prisma.userProfile.findUnique({
        where: {
          id: profileId,
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
          preferredRole: {
            include: {
              role: true,
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
   * Update user profile
   * @param profileId - ID of the profile to update
   * @param updateProfileDto - Data to update
   * @returns Updated user profile
   */
  async updateProfile(
    profileId: number,
    updateProfileDto: UpdateUserProfileDto,
  ): Promise<UserProfile> {
    const {
      domain_labels,
      languages,
      technical_labels,
      preferred_role,
      website,
      ...profileData
    } = updateProfileDto;

    try {
      return await this.prisma.userProfile.update({
        where: {
          id: profileId,
        },
        data: {
          ...profileData,
          website: {
            set: website,
          },
          preferredRole: preferred_role
            ? {
                deleteMany: {},
                create: preferred_role.map((roleName) => ({
                  roleName,
                })),
              }
            : undefined,
          interests: domain_labels
            ? {
                deleteMany: {},
                create: domain_labels.map((labelName) => ({
                  labelName,
                })),
              }
            : undefined,
          languages: languages
            ? {
                deleteMany: {},
                create: languages.map((name) => ({
                  language: {
                    connect: { name },
                  },
                })),
              }
            : undefined,
          skills: technical_labels
            ? {
                deleteMany: {},
                create: technical_labels.map((labelName) => ({
                  labelName,
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
          preferredRole: {
            include: {
              role: true,
            },
          },
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_UPDATING_USER_PROFILE,
        error,
      );
    }
  }

  /**
   * Delete user profile
   * @param profileId - ID of the profile to delete
   * @returns Deleted user profile
   */
  async deleteProfile(profileId: number): Promise<UserProfile> {
    try {
      return await this.prisma.userProfile.delete({
        where: {
          id: profileId,
        },
      });
    } catch (error) {
      console.log(error);
      throw ServiceException.ErrorException(
        errorMessages.ERROR_DELETING_USER_PROFILE,
        error,
      );
    }
  }
}
