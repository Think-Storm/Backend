import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponse, Project } from '@think-storm/contracts';
import { ProjectResponseDto } from '../../project/dtos/projectResponse.dto';

export class UserResponseDto implements UserResponse {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  username: string;

  @ApiProperty({ writeOnly: true })
  @Expose()
  password: string;

  @ApiProperty({ writeOnly: true })
  @Expose()
  passwordChangedAt?: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @Expose()
  lastUpdatedAt: Date;

  @ApiProperty({ type: ProjectResponseDto })
  @Expose()
  savedProjects?: Project[];
}
