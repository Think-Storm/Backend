import { Injectable } from '@nestjs/common';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { UserRepository } from './user.repository';
import { errorMessages } from '../../common/enums/errorMessages';
import { UserResponseDto } from '../user/dtos/userResponse.dto';
import { UserMapper } from '../user/dtos/user.mapper';
import { User } from '@prisma/client';
import { CreateUserDto } from '../user/dtos/createUser.dto';
import { UpdateUserDto } from './dtos/updateUser.dto';
import { PasswordEncryption } from '../../common/encryption/passwordEncryption';
import { CreateUserProfileDto } from './dtos/createUserProfile.dto';
import { UserProfileResponseDto } from '../user/dtos/userProfileResponse.dto';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private userMapper: UserMapper,
    private passwordEncryption: PasswordEncryption,
  ) {}

  /**
   * Checks if a user with the given email exists
   * @param email - The email to check
   * @returns A promise resolving to a User object or null
   */
  doesUserWithEmailExist = async (email: string): Promise<User> => {
    return await this.userRepository.getUserByEmail(email);
  };

  /**
   * get user by ID
   * @param userId - ID for getting user
   * @returns A promise resolving to a UserResponseDto
   */
  async getUserById(userId: number): Promise<UserResponseDto> {
    const foundUser = await this.userRepository.getUserById(userId);

    if (!foundUser)
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('User', userId.toString()),
      );
    return this.userMapper.userToUserResponseDTO(foundUser);
  }

  /**
   * create user
   * @param createUserDto - CreateUserDto that has new user information
   * @param passwordSalt - passwordSalt for encrypting password
   * @returns A promise resolving to a User object or null
   */
  createUser = async (
    createUserDto: CreateUserDto,
    passwordSalt: string,
  ): Promise<User> => {
    return await this.userRepository.createUser(createUserDto, passwordSalt);
  };

  /**
   * update user
   * @param updateUserDto - UpdateUserDto that has updated user information
   * @returns A promise resolving to the updated User object or null
   */
  updateUserById = async (
    updateUser: UpdateUserDto,
    userId: number,
  ): Promise<UserResponseDto> => {
    // check if the user exists
    const foundUser = await this.userRepository.getUserById(updateUser.id);
    if (!foundUser) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('User', updateUser.id.toString()),
      );
    }

    // Authorization check in service layer
    if (foundUser.id !== userId) {
      throw ServiceException.ForbiddenException(
        errorMessages.FORBIDDEN('You are not the owner of this account'),
      );
    }

    // check for duplicated emails
    if (foundUser.email !== updateUser.email) {
      const isExist = await this.doesUserWithEmailExist(updateUser.email);
      if (isExist) {
        throw ServiceException.BadRequestException(
          errorMessages.USER_WITH_EMAIL_ALREADY_EXISTS,
        );
      }
    }

    const passwordInformation =
      await this.passwordEncryption.createSaltAndHashedPassword(
        updateUser.password,
      );
    updateUser.password = passwordInformation.hashedPassword;

    const updatedUserFromRepo = await this.userRepository.updateUser(
      updateUser,
      passwordInformation.passwordSalt,
    );

    return this.userMapper.userToUserResponseDTO(updatedUserFromRepo);
  };

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
      await this.userRepository.getUserProfileByUserId(profileUserId);
    if (existingProfile) {
      throw ServiceException.BadRequestException(
        'User profile already exists. Use update endpoint instead.',
      );
    }

    return await this.userRepository.createUserProfile(
      profileUserId,
      createProfileDto,
    );
  }

  /**
   * Get user profile by ID
   * @param userId - ID for getting user profile
   * @returns A promise resolving to a UserProfileResponseDto
   */
  async getUserProfileById(userId: number): Promise<UserProfileResponseDto> {
    const foundProfile =
      await this.userRepository.getUserProfileByUserId(userId);

    if (!foundProfile)
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('User Profile', userId.toString()),
      );

    const mappedProfile =
      this.userMapper.profileToProfileResponseDTO(foundProfile);
    return mappedProfile;
  }
}
