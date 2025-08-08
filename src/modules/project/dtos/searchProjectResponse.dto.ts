import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectResponseDto } from './projectResponse.dto';
import { defaultUser } from '../../../../test/utils/user.utils';
import { SearchProjectResponse } from '@think-storm/contracts';

export class SearchProjectResponseDto implements SearchProjectResponse {
  @Expose()
  @ApiProperty({
    example: [
      {
        id: 1,
        title: 'title',
        description: 'description',
        language: 'English',
        technicalLabels: ['nestjs', 'js', 'jest'],
        domainLabels: ['Cooking', 'Design', 'Geography'],
        goal: 'Education',
        status: 'InProgress',
        users: [],
        milestone: new Date('2000-01-01'),
        createdAt: new Date('2000-01-01'),
        lastUpdatedAt: new Date('2000-01-01'),
        founder: defaultUser,
      },
    ],
    description: 'Array of projects',
    required: true,
  })
  projects: ProjectResponseDto[];

  @Expose()
  @ApiProperty({
    example: 1,
    description: 'Current page of the result',
    required: true,
  })
  page: number;

  @Expose()
  @ApiProperty({
    example: 10,
    description: 'Number of items for each page',
    required: true,
  })
  limit: number;

  @Expose()
  @ApiProperty({
    example: 2,
    description: 'Total number of pages',
    required: true,
  })
  totalPages: number;

  @Expose()
  @ApiProperty({
    example: 20,
    description: 'Total number of items',
    required: true,
  })
  totalItems: number;
}
