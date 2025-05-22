import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsEmail } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({ description: 'email address of the user', required: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'New password for the user account',
    required: true,
  })
  @IsString()
  @IsOptional()
  password: string;

  @ApiProperty({
    description: 'Password reset token for the user account',
    required: true,
  })
  @IsString()
  @IsOptional()
  passwordResetToken: string;
}
