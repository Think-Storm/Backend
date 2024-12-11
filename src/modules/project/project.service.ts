import { Injectable } from '@nestjs/common';
import { ProjectRepository } from './project.repository';
import { ProjectMapper } from './dtos/project.mapper';
import { ProjectResponseDto } from './dtos/projectResponse.dto';
import { errorMessages } from '../../common/enums/errorMessages';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { CreateProjectRequestDto } from './dtos/createProjectRequest.dto';
import { UserService } from '../user/user.service';
import { UpdateProjectRequestDto } from './dtos/updateProjectRequest.dto';

@Injectable()
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,
    private projectMapper: ProjectMapper,
    private readonly userService: UserService,
  ) {}

  /**
   * Finds a Project by id
   * @param id - The id of the Project to find
   * @returns A promise resolving to the ProjectResponseDto
   */
  async getProjectById(id: number): Promise<ProjectResponseDto> {
    const fetchedProject = await this.projectRepository.findProjectById(id);
    if (!fetchedProject) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Project', id.toString()),
      );
    }
    return this.projectMapper.projectToProjectResponseDto(fetchedProject);
  }

  /**
   * Creates a new project
   * @param createProjectDto - The data transfer object for creating a project
   * @returns A promise resolving to a CreateProjectResponseDto
   */
  async createProject(
    createProjectDto: CreateProjectRequestDto,
  ): Promise<ProjectResponseDto> {
    // Checks if founder does exist
    await this.userService.getUserById(createProjectDto.founderId);
    const createdProject =
      await this.projectRepository.createProject(createProjectDto);

    return this.projectMapper.projectToProjectResponseDto(createdProject);
  }

  /**
   * Updates a project
   * @param id - The id of the project to update
   * @param updateProjectDto - The data transfer object for updating a project
   * @param userId - The id of the user making the request
   * @returns A promise resolving to the updated ProjectResponseDto
   */
  async updateProject(
    body: UpdateProjectRequestDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findProjectById(body.id);
    if (!project) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Project', body.id.toString()),
      );
    }
    if (project.founderId !== body.founderId) {
      throw ServiceException.ForbiddenException(
        errorMessages.FORBIDDEN('You are not the owner of this project'),
      );
    }
    const updatedProject = await this.projectRepository.updateProject(body);
    return this.projectMapper.projectToProjectResponseDto(updatedProject);
  }
}
