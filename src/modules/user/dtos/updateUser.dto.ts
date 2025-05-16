import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsDate,
  IsNumber,
} from 'class-validator';
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

  @ApiProperty({
    description: 'New password for the user account',
    required: false,
  })
  @IsString()
  @IsOptional()
  password: string;

  @ApiProperty({ description: 'New full name of the user', required: true })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'New birthdate of the user',
    required: true,
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  birthdate: Date;
}
