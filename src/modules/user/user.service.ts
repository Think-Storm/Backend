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

  /**
   * delete user by ID
   * @param userId - ID for deleting user
   */
  async deleteUserById(currentUserId: number, userId: number) {
    const foundUser = await this.userRepository.getUserById(userId);

    if (!foundUser) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('User', userId.toString()),
      );
    }

    if (foundUser.id !== currentUserId) {
      throw ServiceException.ForbiddenException(
        errorMessages.FORBIDDEN('You are not the owner of this account'),
      );
    }

    return await this.userRepository.deleteUserById(userId);
  }
}
