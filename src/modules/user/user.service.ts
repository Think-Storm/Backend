import { Injectable } from '@nestjs/common';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { UserRepository } from './user.repository';
import { errorMessages } from '../../common/enums/errorMessages';
import { UserResponseDto } from '../auth/dtos/userResponse.dto';
import { UserMapper } from '../auth/dtos/user.mapper';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private userMapper: UserMapper,
  ) {}

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
}
