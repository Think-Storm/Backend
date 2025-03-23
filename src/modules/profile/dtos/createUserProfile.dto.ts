import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsArray, IsEnum } from 'class-validator';
import { LanguageCode } from '@prisma/client';

export class CreateUserProfileDto {
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

  @ApiProperty({
    description: 'Preferred role in projects',
    required: false,
  })
  @IsOptional()
  @IsString()
  preferred_role?: string;

  @ApiProperty({
    description: 'User location',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Personal website URL',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

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
    enum: LanguageCode,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(LanguageCode, { each: true })
  languages?: LanguageCode[];

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
