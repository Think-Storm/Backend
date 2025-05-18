import { Inject, Injectable } from '@nestjs/common';
import { ProjectRepository } from './project.repository';
import { ProjectMapper } from './dtos/project.mapper';
import { ProjectResponseDto } from './dtos/projectResponse.dto';
import { errorMessages } from '../../common/enums/errorMessages';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { CreateProjectRequestDto } from './dtos/createProjectRequest.dto';
import { UserService } from '../user/user.service';
import { UpdateProjectRequestDto } from './dtos/updateProjectRequest.dto';
import { SearchProjectDto } from './dtos/searchProject.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/caching/redisCaching.service';
import { GetProjectRequestDto } from './dtos/getProjectRequest.dto';
import { Project } from '@prisma/client';
import { SearchProjectResponseDto } from './dtos/searchProjectResponse.dto';

@Injectable()
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,
    private projectMapper: ProjectMapper,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private redisService: RedisService,
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

    //cache invalidation
    await this.redisService.flushDb();

    return this.projectMapper.projectToProjectResponseDto(createdProject);
  }

  /**
   * Updates a project
   * @param body - The data transfer object for updating a project
   * @param userId - The id of the user updating the project
   * @returns A promise resolving to the updated ProjectResponseDto
   */
  async updateProject(
    body: UpdateProjectRequestDto,
    userId: number,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findProjectById(body.id);
    if (!project) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Project', body.id.toString()),
      );
    }

    // Authorization check in service layer
    if (project.founderId !== userId) {
      throw ServiceException.ForbiddenException(
        errorMessages.FORBIDDEN('You are not the owner of this project'),
      );
    }

    const updatedProject = await this.projectRepository.updateProject(body);

    //cache invalidation
    await this.redisService.flushDb();

    return this.projectMapper.projectToProjectResponseDto(updatedProject);
  }

  /**
   * Search projects by query
   * @param searchProjectDto - The data transfer object for searching projects
   * @returns A promise resolving to a ProjectResponseDto
   */
  async searchProjects(
    searchProjectDto: SearchProjectDto,
  ): Promise<SearchProjectResponseDto> {
    const cacheKey = this.generateCacheKey(searchProjectDto);

    // Try to get cached result
    const cachedResult = await this.cacheManager.get<{
      projects: Project[];
      totalItems: number;
    }>(cacheKey);

    let projects: Project[];
    let totalItems: number;

    if (cachedResult) {
      ({ projects, totalItems } = cachedResult);
    } else {
      const sortByArr = this.parseSortConditions(searchProjectDto.sort);

      const { projects: searchedProjects, totalItems: itemsCount } =
        await this.projectRepository.searchProjects(
          searchProjectDto,
          sortByArr,
        );

      projects = searchedProjects;
      totalItems = itemsCount;

      const cachePayload = { projects, totalItems };
      const ttl =
        Number(this.configService.get<number>('REDIS_CACHING_TTL')) || 3600;

      await this.cacheManager.set(cacheKey, cachePayload, ttl);
      await this.redisService.set(cacheKey, cachePayload, ttl);
    }

    const projectsResult =
      this.projectMapper.projectsToProjectResponseDtos(projects);

    const totalPages = Math.ceil(totalItems / searchProjectDto.limit);
    const page = searchProjectDto.page;
    const limit = searchProjectDto.limit;

    return this.projectMapper.projectResponseDtoToSearchProjectResponseDtos(
      projectsResult,
      page,
      limit,
      totalPages,
      totalItems,
    );
  }

  /**
   * Generate a consistent cache key for project search
   */
  private generateCacheKey(dto: SearchProjectDto): string {
    return JSON.stringify(dto);
  }

  /**
   * Parse sort query string into Prisma orderBy format
   */
  private parseSortConditions(sort?: string): Array<Record<string, string>> {
    if (!sort) return [];

    return sort.split(',').map((sortCondition) => {
      const [field, order] = sortCondition.split('=');
      return { [field]: order };
    });
  }

  /**
   * Deletes a project
   * @param deleteProjectDto - The data transfer object for deleting a project
   * @returns A promise resolving to a DeleteProjectResponseDto
   */
  async deleteProject(
    deleteProjectDto: GetProjectRequestDto,
    userId: number,
  ): Promise<ProjectResponseDto> {
    const deltingProject = await this.projectRepository.findProjectById(
      deleteProjectDto.id,
    );

    if (!deltingProject) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND(
          'Project',
          deleteProjectDto.id.toString(),
        ),
      );
    }

    // Authorization check in service layer
    if (deltingProject.founderId !== userId) {
      throw ServiceException.ForbiddenException(
        errorMessages.FORBIDDEN('You are not the owner of this project'),
      );
    }

    const deletedProject = await this.projectRepository.deleteProjectById(
      deleteProjectDto.id,
    );

    //cache invalidation
    await this.redisService.flushDb();

    return this.projectMapper.projectToProjectResponseDto(deletedProject);
  }
}
