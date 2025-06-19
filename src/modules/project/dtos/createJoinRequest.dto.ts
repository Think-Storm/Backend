import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsNotEmpty } from 'class-validator';
import { ProjectJoinRequest } from '@think-storm/contracts';

export class CreateJoinRequestDto implements ProjectJoinRequest {
  @ApiProperty({
    description: 'User ID who makes the join request',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'Project ID for the join request',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  projectId: number;

  @ApiProperty({
    description: 'Role name for the join request',
    example: 'Developer',
  })
  @IsString()
  @IsNotEmpty()
  roleName: string;

  @ApiProperty({
    description: 'Optional message for the join request',
    example:
      'I have 5 years of experience in React and would love to contribute!',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}
