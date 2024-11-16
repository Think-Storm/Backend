import { Project } from '@prisma/client';
import { ProjectResponseDto } from './projectResponse.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ProjectMapper {
  /**
   * Maps a Project entity to a ProjectResponseDto
   * @param project - The Project entity to be mapped
   * @returns A ProjectResponseDto with the mapped data
   */
  @ApiProperty({ type: ProjectResponseDto })
  projectToProjectResponseDto(project: Project): ProjectResponseDto {
    return plainToInstance(ProjectResponseDto, instanceToPlain(project), {
      excludeExtraneousValues: true,
    });
  }
}
