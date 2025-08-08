import {
  Goal,
  LanguageName,
  ProjectStatus,
  SearchProject,
} from '@think-storm/contracts';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDefault, SortDefault } from '../../../common/consts';
import { IsBeforeDate } from '../../../common/decorator/isBeforeDate';
import { IsAfterDate } from '../../../common/decorator/isAfterDate';

export class SearchProjectDto implements SearchProject {
  @ApiProperty({
    description: 'Search query to search the projects',
    required: false,
  })
  @IsString()
  @IsOptional()
  searchQuery?: string;

  @ApiProperty({
    description: 'The title of the project',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'The language name of the project',
    enum: LanguageName,
    required: false,
  })
  @IsEnum(LanguageName)
  @IsOptional()
  languageName?: LanguageName;

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
    description: 'The goal of the project',
    enum: Goal,
    required: false,
  })
  @IsEnum(Goal)
  @IsOptional()
  goal?: Goal;

  @ApiProperty({
    example: 'nestjs,js,jest',
    description: 'The technical labels associated with the project',
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  technicalLabels?: string;

  @ApiProperty({
    example: 'Cooking,Design,Geography',
    description: 'The domain labels associated with the project',
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  domainLabels?: string;

  @ApiProperty({
    example: '2023-12-31',
    description: 'The milestone date of the project',
    required: false,
  })
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  @IsOptional()
  @IsBeforeDate('mileStoneTo')
  mileStoneFrom: Date;

  @ApiProperty({
    example: '2023-12-31',
    description: 'The milestone date of the project',
    required: false,
  })
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  @IsOptional()
  @IsAfterDate('mileStoneFrom')
  mileStoneTo: Date;

  @ApiProperty({
    example: '2023-01-01',
    description: 'The creation date of the project',
    required: false,
  })
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  @IsOptional()
  @IsBeforeDate('createdAtTo')
  createdAtFrom: Date;

  @ApiProperty({
    example: '2023-01-01',
    description: 'The creation date of the project',
    required: false,
  })
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  @IsOptional()
  @IsAfterDate('createdAtFrom')
  createdAtTo: Date;

  @ApiProperty({
    example: '2023-01-02',
    description: 'The last update date of the project',
    required: false,
  })
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  @IsOptional()
  @IsBeforeDate('lastUpdatedAtTo')
  lastUpdatedAtFrom: Date;

  @ApiProperty({
    example: '2023-01-02',
    description: 'The last update date of the project',
    required: false,
  })
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  @IsOptional()
  @IsAfterDate('lastUpdatedAtFrom')
  lastUpdatedAtTo: Date;

  @ApiProperty({
    description: 'Page of the search results',
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  page?: number = PaginationDefault.PAGE_DEFAULT;

  @ApiProperty({
    description: 'Current page of the search results',
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  limit?: number = PaginationDefault.LIMIT_DEFAULT;

  @ApiProperty({
    description: 'Sort conditions of search results',
    required: false,
  })
  @IsString()
  @IsOptional()
  sort?: string = SortDefault.SORT_DEFAULT;
}
