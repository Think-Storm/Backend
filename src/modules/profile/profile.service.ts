import { Injectable } from '@nestjs/common';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { ProfileRepository } from './profile.repository';
import { errorMessages } from '../../common/enums/errorMessages';
import { CreateUserProfileDto } from './dtos/createUserProfile.dto';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class ProfileService {
  constructor(
    private profileRepository: ProfileRepository,
    private userRepository: UserRepository,
  ) {}

  async createUserProfile(
    profileUserId: number,
    createProfileDto: CreateUserProfileDto,
    requestUserId: number,
  ) {
    // Authorization check - can only create profile for own user
    if (profileUserId !== requestUserId) {
      throw ServiceException.ForbiddenException(
        errorMessages.FORBIDDEN(
          'You can only create a profile for your own user account',
        ),
      );
    }

    // Check if user exists
    const user = await this.userRepository.getUserById(profileUserId);
    if (!user) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('User', profileUserId.toString()),
      );
    }

    // Check if profile already exists
    const existingProfile =
      await this.profileRepository.getUserProfileByUserId(profileUserId);
    if (existingProfile) {
      throw ServiceException.BadRequestException(
        'User profile already exists. Use update endpoint instead.',
      );
    }

    return await this.profileRepository.createUserProfile(
      profileUserId,
      createProfileDto,
    );
  }
}
