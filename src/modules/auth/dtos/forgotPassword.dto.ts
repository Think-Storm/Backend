import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'email address of the user', required: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
