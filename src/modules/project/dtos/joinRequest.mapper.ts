import { JoinRequest } from '@prisma/client';
import { JoinRequestResponseDto } from './joinRequestResponse.dto';

export class JoinRequestMapper {
  /**
   * Converts a Prisma JoinRequest to JoinRequestResponseDto
   * @param joinRequest - The Prisma JoinRequest object
   * @returns A JoinRequestResponseDto object
   */
  static joinRequestToJoinRequestResponseDto(
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
