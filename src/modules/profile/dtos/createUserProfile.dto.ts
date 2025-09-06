import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUrl,
  IsArray,
  IsEnum,
  IsDate,
} from 'class-validator';
import { LanguageName, CreateProfile, UserRole } from '@think-storm/contracts';
import { Transform } from 'class-transformer';

export class CreateUserProfileDto implements CreateProfile {
  @ApiProperty({
    description: 'URL to user avatar',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  avatar?: string;

  @ApiProperty({
    description: 'User biography',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: 'Full name of the user', required: false })
  @IsString()
  @IsOptional()
  fullName: string;

  @ApiProperty({
    description: 'Birthdate of the user',
    required: false,
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsOptional()
  birthdate: Date;

  @ApiProperty({
    description: 'Preferred roles in projects',
    required: false,
    enum: UserRole,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  preferred_role?: UserRole[];

  @ApiProperty({
    description: 'User location',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'User timezone',
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({
    description: 'Personal website URL',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: 'Each website must be a valid URL' })
  website?: string[];

  @ApiProperty({
    description: 'Personal website URL Type',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each website type must be string' })
  websiteType?: string[];

  @ApiProperty({
    description: 'Domain labels associated with the user profile',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  domain_labels?: string[];

  @ApiProperty({
    description: 'Programming languages known by the user',
    required: false,
    enum: LanguageName,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(LanguageName, { each: true })
  languages?: LanguageName[];

  @ApiProperty({
    description: 'Technical skills and labels',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technical_labels?: string[];
}
