import { WaitingListUser } from '@prisma/client';
import { WaitingListUserResponseDto } from './waitingListUserResponse.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';

export class WaitingListUserMapper {
  /**
   * Maps a WaitingListUser entity to a WaitingListUserResponseDto
   * @param waitingListUser - The WaitingListUser entity to be mapped
   * @returns A WaitingListUserResponseDto with the mapped data
   */
  waitingListUserToWaitingListUserResponseDTO(
    waitingListUser: WaitingListUser,
  ): WaitingListUserResponseDto {
    return plainToInstance(
      WaitingListUserResponseDto,
      instanceToPlain(waitingListUser),
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
