import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsInt,
} from 'class-validator';
import { ProjectStatus, Goal, LanguageCode } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateProjectRequestDto {
  @ApiProperty({ description: 'The ID of the founder' })
  @IsInt()
  @IsNotEmpty()
  founderId: number;

  @ApiProperty({ description: 'The ID of the project' })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: 'The title of the project', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'The description of the project',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The status of the project',
    enum: ProjectStatus,
    required: false,
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({
    description: 'The language code of the project',
    required: false,
  })
  @IsString()
  @IsOptional()
  languageCode?: LanguageCode;

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

  @ApiProperty({
    description: 'The domain labels associated with the project',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  domainLabels?: string[];

  @ApiProperty({
    description: 'The technical labels associated with the project',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  technicalLabels?: string[];

  @ApiProperty({ description: 'The goal of the project', enum: Goal })
  @IsEnum(Goal)
  @IsNotEmpty()
  goal: Goal;
}
