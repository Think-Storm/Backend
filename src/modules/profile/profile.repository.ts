import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserProfile } from '@prisma/client';
import { CreateUserProfileDto } from './dtos/createUserProfile.dto';
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
   * @param createProfileDto.languages - Array of language codes the user knows
   * @param createProfileDto.technical_labels - Array of technical skills/technologies
   * @param createProfileDto.prefered_role - User's prefered role in projects
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
      ...profileData
    } = createProfileDto;

    try {
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
}
