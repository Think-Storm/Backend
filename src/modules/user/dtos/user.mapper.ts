import { User } from '@prisma/client';
import { UserResponseDto } from './userResponse.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';

export class UserMapper {
  /**
   * Maps a User entity to a UserResponseDto
   * @param user - The User entity to be mapped
   * @returns A UserResponseDto with the mapped data
   */
  userToUserResponseDTO(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, instanceToPlain(user), {
      excludeExtraneousValues: true,
    });
  }
}
