import { instanceToPlain, plainToInstance } from 'class-transformer';
import { UserResponseDto } from './userResponse.dto';
import { ApiProperty } from '@nestjs/swagger';
import { UserWithRelations } from '../types/user.types';

export class UserMapper {
  /**
   * Maps a User entity to a UserResponseDto
   * @param user - The User entity to be mapped
   * @returns A UserResponseDto with the mapped data
   */
  @ApiProperty({ type: UserResponseDto })
  userToUserResponseDTO(user: UserWithRelations): UserResponseDto {
    const plainUser = instanceToPlain(user);
    // Transform joinRequest array if they exist and have the complex structure
    if (user.savedProjects?.length > 0 && 'project' in user.savedProjects[0]) {
      plainUser.savedProjects = user.savedProjects.map((user) => user.project);
    }

    return plainToInstance(UserResponseDto, instanceToPlain(user), {
      excludeExtraneousValues: true,
    });
  }
}
