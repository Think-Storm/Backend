import { User, UserProfile } from '@prisma/client';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { UserResponseDto } from './userResponse.dto';
import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponseDto } from './userProfileResponse.dto';

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

  /**
   * Maps a UserProfile entity to a UserProfileResponseDto
   * @param profile - The UserProfile entity to be mapped
   * @returns A UserProfileResponseDto with the mapped data
   */
  @ApiProperty({ type: UserProfileResponseDto })
  profileToProfileResponseDTO(profile: UserProfile): UserProfileResponseDto {
    const plainProfile = instanceToPlain(profile);

    return plainToInstance(UserProfileResponseDto, plainProfile, {
      excludeExtraneousValues: true,
    });
  }
}
