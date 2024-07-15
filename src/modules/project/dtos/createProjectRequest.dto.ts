import { Goal, LanguageCode, Status } from '@prisma/client';
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

export class CreateProjectRequestDto {
  @IsInt()
  @IsNotEmpty()
  founderId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @IsEnum(Goal)
  @IsNotEmpty()
  goal: Goal;

  @IsEnum(Status)
  @IsNotEmpty()
  status: Status;

  @IsEnum(LanguageCode)
  @IsNotEmpty()
  languageCode: LanguageCode;

  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsOptional()
  milestone?: Date;
}
