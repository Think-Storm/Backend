import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateJoinRequestDto {
  @ApiProperty({
    description: 'Role name for the join request',
    example: 'Developer',
  })
  @IsString()
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
