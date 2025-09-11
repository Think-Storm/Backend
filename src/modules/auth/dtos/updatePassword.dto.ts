import { ApiProperty } from '@nestjs/swagger';
import { UpdatePassword } from '@think-storm/contracts';
import { IsString } from 'class-validator';

export class UpdatePasswordDto implements UpdatePassword {
  @ApiProperty({
    description: 'Current password for the user account',
    required: true,
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password for the user account',
    required: true,
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'New password for the user account',
    required: true,
  })
  @IsString()
  confirmPassword: string;
}
