import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserProfileDto } from './dtos/createUserProfile.dto';
import { UpdateUserProfileDto } from './dtos/updateUserProfile.dto';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { errorMessages } from '../../common/enums/errorMessages';
import { UserProfile } from '@think-storm/contracts';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new user profile with associated domain interests, languages, and technical skills
   * @param userId - The ID of the user to create the profile for
   * @param createProfileDto - Data transfer object containing profile information
   * @param createProfileDto.domainLabels - Array of domain/interest areas (e.g., "AI", "Web Development")
   * @param createProfileDto.languages - Array of language names the user knows
   * @param createProfileDto.technicalLabels - Array of technical skills/technologies
   * @param createProfileDto.preferredRole - User's preferred role in projects
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
      domainLabels,
      languages,
      technicalLabels,
      preferredRole,
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
          preferredRole: preferredRole
            ? {
                create: preferredRole.map((roleName) => ({
                  roleName,
                })),
              }
            : undefined,
          interests: domainLabels
            ? {
                create: domainLabels.map((labelName) => ({
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
          skills: technicalLabels
            ? {
                create: technicalLabels.map((labelName) => ({
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
      domainLabels,
      languages,
      technicalLabels,
      preferredRole,
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
          preferredRole: preferredRole
            ? {
                deleteMany: {},
                create: preferredRole.map((roleName) => ({
                  roleName,
                })),
              }
            : undefined,
          interests: domainLabels
            ? {
                deleteMany: {},
                create: domainLabels.map((labelName) => ({
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
          skills: technicalLabels
            ? {
                deleteMany: {},
                create: technicalLabels.map((labelName) => ({
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
