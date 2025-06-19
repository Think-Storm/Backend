import { ApiProperty } from '@nestjs/swagger';
import { JoinRequestStatus } from '@think-storm/contracts';

export class JoinRequestResponseDto {
  @ApiProperty({
    description: 'User ID who made the join request',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'Project ID for the join request',
    example: 1,
  })
  projectId: number;

  @ApiProperty({
    description: 'Role name for the join request',
    example: 'Developer',
  })
  roleName: string;

  @ApiProperty({
    description: 'Status of the join request',
    example: 'Pending',
    enum: JoinRequestStatus,
  })
  status: string;

  @ApiProperty({
    description: 'Optional message for the join request',
    example:
      'I have 5 years of experience in React and would love to contribute!',
    required: false,
  })
  message?: string;
}
