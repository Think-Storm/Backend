import { ApiProperty } from '@nestjs/swagger';
import { CreateJoinRequest } from '@think-storm/contracts';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateJoinRequestBodyDto implements CreateJoinRequest {
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
