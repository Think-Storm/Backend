import { Goal, LanguageCode, ProjectStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsArray,
  IsEnum,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectRequestDto {
  @ApiProperty({ description: 'The ID of the founder' })
  @IsInt()
  @IsNotEmpty()
  founderId: number;

  @ApiProperty({ description: 'The title of the project' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The description of the project',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The technical labels associated with the project',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  technicalLabels?: string[];

  @ApiProperty({
    description: 'The domain labels associated with the project',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  domainLabels?: string[];

  @ApiProperty({ description: 'The goal of the project', enum: Goal })
  @IsEnum(Goal)
  @IsNotEmpty()
  goal: Goal;
  @ApiProperty({
    description: 'The status of the project',
    enum: ProjectStatus,
  })
  @IsEnum(ProjectStatus)
  @IsNotEmpty()
  status: ProjectStatus;

  @ApiProperty({
    description: 'The language code of the project',
    enum: LanguageCode,
  })
  @IsEnum(LanguageCode)
  @IsNotEmpty()
  languageCode: LanguageCode;

  @ApiProperty({
    description: 'The milestone date of the project',
    required: false,
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsOptional()
  milestone?: Date;
}
