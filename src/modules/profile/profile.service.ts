import { Injectable } from '@nestjs/common';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { ProfileRepository } from './profile.repository';
import { errorMessages } from '../../common/enums/errorMessages';
import { CreateUserProfileDto } from './dtos/createUserProfile.dto';
import { UpdateUserProfileDto } from './dtos/updateUserProfile.dto';
import { UserRepository } from '../user/user.repository';
import { ProfileMapper } from './dtos/profile.mapper';

@Injectable()
export class ProfileService {
  constructor(
    private profileRepository: ProfileRepository,
    private userRepository: UserRepository,
    private profileMapper: ProfileMapper,
  ) {}

  async createUserProfile(
    profileUserId: number,
    createProfileDto: CreateUserProfileDto,
    requestUserId: number,
  ) {
    // Check if user exists
    const user = await this.userRepository.getUserById(profileUserId);
    if (!user) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('User', profileUserId.toString()),
      );
    }

    // Authorization check - can only create profile for own user
    if (profileUserId !== requestUserId) {
      throw ServiceException.ForbiddenException(
        errorMessages.FORBIDDEN(
          'You can only create a profile for your own user account',
        ),
      );
    }

    // Check if profile already exists
    const existingProfile =
      await this.profileRepository.getUserProfileByUserId(profileUserId);
    if (existingProfile) {
      throw ServiceException.BadRequestException(
        'User profile already exists.',
      );
    }

    const createdProfile = await this.profileRepository.createUserProfile(
      profileUserId,
      createProfileDto,
    );

    return this.profileMapper.profileToProfileResponseDto(createdProfile);
  }

  /**
   * Get user profile by profile ID
   * @param profileId - ID of the profile to get
   * @param requestUserId - ID of the requesting user
   * @returns User profile if exists
   */
  async getProfileById(profileId: number, requestUserId: number) {
    const profile = await this.profileRepository.getProfileById(profileId);

    if (!profile) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Profile', profileId.toString()),
      );
    }

    // Authorization check - can only view own profile
    if (profile.userId !== requestUserId) {
      throw ServiceException.ForbiddenException(
        errorMessages.FORBIDDEN('You can only view your own profile'),
      );
    }

    return this.profileMapper.profileToProfileResponseDto(profile);
  }

  /**
   * Update user profile
   * @param profileId - ID of the profile to update
   * @param updateProfileDto - Data to update
   * @param requestUserId - ID of the requesting user
   * @returns Updated user profile
   */
  async updateProfile(
    profileId: number,
    updateProfileDto: UpdateUserProfileDto,
    requestUserId: number,
  ) {
    const profile = await this.profileRepository.getProfileById(profileId);

    if (!profile) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Profile', profileId.toString()),
      );
    }

    // Authorization check - can only update own profile
    if (profile.userId !== requestUserId) {
      throw ServiceException.ForbiddenException(
        errorMessages.FORBIDDEN('You can only update your own profile'),
      );
    }

    const updatedProfile = await this.profileRepository.updateProfile(
      profileId,
      updateProfileDto,
    );

    return this.profileMapper.profileToProfileResponseDto(updatedProfile);
  }

  /**
   * Delete user profile
   * @param profileId - ID of the profile to delete
   * @param requestUserId - ID of the requesting user
   * @returns Deleted user profile
   */
  async deleteProfile(profileId: number, requestUserId: number) {
    const profile = await this.profileRepository.getProfileById(profileId);

    if (!profile) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Profile', profileId.toString()),
      );
    }

    // Authorization check - can only delete own profile
    if (profile.userId !== requestUserId) {
      throw ServiceException.ForbiddenException(
        errorMessages.FORBIDDEN('You can only delete your own profile'),
      );
    }

    const deletedProfile =
      await this.profileRepository.deleteProfile(profileId);

    return this.profileMapper.profileToProfileResponseDto(deletedProfile);
  }
}
