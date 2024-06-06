import { Project } from '@prisma/client';
import { GetProjectResponseDto } from './getProjectResponse.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';

export class ProjectMapper {
  /**
   * Maps a Project entity to a GetProjectResponseDto
   * @param project - The Project entity to be mapped
   * @returns A GetProjectResponseDto with the mapped data
   */
  projectToGetProjectResponseDto(project: Project): GetProjectResponseDto {
    return plainToInstance(GetProjectResponseDto, instanceToPlain(project), {
      excludeExtraneousValues: true,
    });
  }
}
