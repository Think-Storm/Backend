import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsNumber } from 'class-validator';
import { UpdateUser } from '@think-storm/contracts';

export class UpdateUserDto implements UpdateUser {
  @ApiProperty({ description: 'User ID', required: true })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: 'New username of the user', required: true })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'New email address of the user', required: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
