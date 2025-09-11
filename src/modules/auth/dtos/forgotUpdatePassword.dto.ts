import { ApiProperty } from '@nestjs/swagger';
import { ForgotUpdatePassword } from '@think-storm/contracts';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class ForgotUpdatePasswordDto implements ForgotUpdatePassword {
  @ApiProperty({ description: 'email address of the user', required: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'New password for the user account',
    required: true,
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Password reset token for the user account',
    required: true,
  })
  @IsString()
  passwordResetToken: string;
}
