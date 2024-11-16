import { User } from '@prisma/client';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { UserResponseDto } from './userResponse.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UserMapper {
  /**
   * Maps a User entity to a UserResponseDto
   * @param user - The User entity to be mapped
   * @returns A UserResponseDto with the mapped data
   */
  @ApiProperty({ type: UserResponseDto })
  userToUserResponseDTO(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, instanceToPlain(user), {
      excludeExtraneousValues: true,
    });
  }
}
