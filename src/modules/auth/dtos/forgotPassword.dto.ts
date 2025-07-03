import { ApiProperty } from '@nestjs/swagger';
import { ForgotPassword } from '@think-storm/contracts';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class ForgotPasswordDto implements ForgotPassword {
  @ApiProperty({ description: 'email address of the user', required: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
