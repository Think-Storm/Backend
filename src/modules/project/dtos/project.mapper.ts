import { Project } from '@prisma/client';
import { ProjectResponseDto } from './projectResponse.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';

export class ProjectMapper {
  /**
   * Maps a Project entity to a ProjectResponseDto
   * @param project - The Project entity to be mapped
   * @returns A ProjectResponseDto with the mapped data
   */
  projectToProjectResponseDto(project: Project): ProjectResponseDto {
    return plainToInstance(ProjectResponseDto, instanceToPlain(project), {
      excludeExtraneousValues: true,
    });
  }
}
