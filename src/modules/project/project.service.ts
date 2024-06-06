import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from './project.repository';
import { ProjectMapper } from './dtos/project.mapper';
import { GetProjectResponseDto } from './dtos/getProjectResponse.dto';
import { errorMessages } from '../../common/enums/errorMessages';

@Injectable()
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,
    private projectMapper: ProjectMapper,
  ) {}

  /**
   * Finds a Project by id
   * @param id - The id of the Project to find
   * @returns A promise resolving to the GetProjectResponseDto
   */
  async getProjectById(id: number): Promise<GetProjectResponseDto> {
    const fetchedProject = await this.projectRepository.findProjectById(id);
    if (!fetchedProject) {
      throw new NotFoundException(
        errorMessages.PROJECT_NOT_FOUND(id.toString()),
      );
    }
    return this.projectMapper.projectToGetProjectResponseDto(fetchedProject);
  }
}
