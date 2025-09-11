import { JoinRequest } from '@think-storm/contracts';
import { JoinRequestResponseDto } from './joinRequestResponse.dto';
import { ApiProperty } from '@nestjs/swagger';

export class JoinRequestMapper {
  /**
   * Converts a Prisma JoinRequest to JoinRequestResponseDto
   * @param joinRequest - The Prisma JoinRequest object
   * @returns A JoinRequestResponseDto object
   */
  @ApiProperty({ type: JoinRequestResponseDto })
  joinRequestToJoinRequestResponseDto(
    joinRequest: JoinRequest,
  ): JoinRequestResponseDto {
    return {
      userId: joinRequest.userId,
      projectId: joinRequest.projectId,
      roleName: joinRequest.roleName,
      status: joinRequest.status,
      message: joinRequest.message,
    };
  }
}
