import { Injectable } from '@nestjs/common';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { UserRepository } from './user.repository';
import { errorMessages } from '../../common/enums/errorMessages';
import { UserResponseDto } from '../user/dtos/userResponse.dto';
import { UserMapper } from '../user/dtos/user.mapper';
import { User } from '@prisma/client';
import { CreateUserDto } from '../user/dtos/createUser.dto';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private userMapper: UserMapper,
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
}
