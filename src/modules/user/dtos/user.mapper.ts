import { User } from '@prisma/client';
import { CreateUserResponseDto } from './createUserResponse.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';

export class UserMapper {
  /**
   * Maps a User entity to a CreateUserResponseDto
   * @param user - The User entity to be mapped
   * @returns A CreateUserResponseDto with the mapped data
   */
  userToCreateUserResponseDTO(user: User): CreateUserResponseDto {
    return plainToInstance(CreateUserResponseDto, instanceToPlain(user), {
      excludeExtraneousValues: true,
    });
  }
}
