import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JoinRequestStatus } from '@think-storm/contracts';

export class UpdateJoinRequestDto {
  @ApiProperty({
    enum: JoinRequestStatus,
    description: 'The status of the join request',
    example: JoinRequestStatus.Accepted,
  })
  @IsNotEmpty()
  @IsEnum(JoinRequestStatus)
  status: JoinRequestStatus;
}
