import {
  Goal,
  Language,
  LanguageCode,
  ProjectStatus,
  User,
} from '@prisma/client';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ProjectResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the project',
  })
  id: number;

  @Expose()
  @ApiProperty({
    example: 'Project Title',
    description: 'The title of the project',
  })
  title: string;

  @Expose()
  @ApiProperty({
    example: 'EN',
    description: 'The language of the project',
    enum: LanguageCode,
  })
  language: Language;

  @Expose()
  @ApiProperty({
    example: ['nestjs', 'js', 'jest'],
    description: 'The technical labels associated with the project',
  })
  technicalLabels?: string[];

  @Expose()
  @ApiProperty({
    example: ['Cooking', 'Design', 'Geography'],
    description: 'The domain labels associated with the project',
  })
  domainLabels?: string[];

  @Expose()
  @ApiProperty({
    example: 'This is a project description',
    description: 'The description of the project',
    required: false,
  })
  description?: string;

  @Expose()
  @ApiProperty({
    example: 'ACTIVE',
    description: 'The status of the project',
    enum: ProjectStatus,
  })
  status: ProjectStatus;

  @Expose()
  @ApiProperty({
    example: 'Educational',
    description: 'The goal of the project',
    enum: Goal,
  })
  goal: Goal;

  @Expose()
  @ApiProperty({
    example: '2023-12-31T00:00:00.000Z',
    description: 'The milestone date of the project',
    required: false,
  })
  milestone?: Date;

  @Expose()
  @ApiProperty({
    type: [Number],
    description: 'The users associated with the project',
  })
  users: User[];

  @Expose()
  @ApiProperty({ type: Number, description: 'The founder of the project' })
  founder: User;

  @Expose()
  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'The creation date of the project',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    example: '2023-01-02T00:00:00.000Z',
    description: 'The last update date of the project',
  })
  lastUpdatedAt: Date;
}
