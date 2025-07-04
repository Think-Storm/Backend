import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { ProjectRepository } from './project.repository';
import { ProjectMapper } from './dtos/project.mapper';
import { JoinRequestMapper } from './dtos/joinRequest.mapper';
import { errorMessages } from '../../common/enums/errorMessages';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { UserService } from '../user/user.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/caching/redisCaching.service';
import { GetProjectRequestDto } from './dtos/getProjectRequest.dto';
import { Project } from '@prisma/client';
import { SearchProjectResponseDto } from './dtos/searchProjectResponse.dto';
import { ProjectResponseDto } from './dtos/projectResponse.dto';
import { CreateProjectRequestDto } from './dtos/createProjectRequest.dto';
import { UpdateProjectRequestDto } from './dtos/updateProjectRequest.dto';
import { SearchProjectDto } from './dtos/searchProject.dto';
import { SaveProjectRequestDto } from './dtos/saveProjectRequest.dto';
import { NotificationService } from '../notification/notification.service';
import { JoinRequestResponseDto } from './dtos/joinRequestResponse.dto';
import { CreateJoinRequestBodyDto } from './dtos/createJoinRequest.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ProjectService {
  constructor(
    private userRepository: UserRepository,
    private projectRepository: ProjectRepository,
    private projectMapper: ProjectMapper,
    private joinRequestMapper: JoinRequestMapper,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private redisService: RedisService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
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

  /**
   * Saves a project
   * @param projectId - project Id to be saved
   * @param saveProjectDto - The data transfer object for saving a project
   * @param userId - user Id requested to save the project
   * @returns A promise resolving to a ProjectResponseDto
   */
  async saveProject(
    projectId: number,
    saveProjectDto: SaveProjectRequestDto,
    userId: number,
  ): Promise<ProjectResponseDto> {
    const savingProject =
      await this.projectRepository.findProjectById(projectId);

    if (!savingProject) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Project', projectId.toString()),
      );
    }

    // Check saved_by_users array if each user id exists
    for (const id of saveProjectDto.saved_by_users) {
      const user = await this.userRepository.getUserById(id);
      if (!user) {
        throw ServiceException.EntityNotFoundException(
          errorMessages.ENTITY_NOT_FOUND('User', id.toString()),
        );
      }
    }

    // create savedUsers Id array from database and check if current user already exists in saved users array
    const savedUsersArr = [];
    for (const user of savingProject.savedByUsers) {
      if (user.userId === userId) {
        throw ServiceException.BadRequestException(
          errorMessages.USER_ALREADY_SAVED_PROJECT,
        );
      }
      savedUsersArr.push(user.userId);
    }

    // add savedUsers Id array to saveProjectDto
    saveProjectDto.saved_by_users = [
      ...saveProjectDto.saved_by_users,
      ...savedUsersArr,
    ];

    // add current user Id if current user doesn't exist in saveProjectDto
    if (!saveProjectDto.saved_by_users.includes(userId)) {
      saveProjectDto.saved_by_users = [
        ...saveProjectDto.saved_by_users,
        userId,
      ];
    }

    // remove duplication
    saveProjectDto.saved_by_users = [...new Set(saveProjectDto.saved_by_users)];

    const savedProject = await this.projectRepository.saveProject(
      projectId,
      saveProjectDto,
    );

    //cache invalidation
    await this.redisService.flushDb();

    return this.projectMapper.projectToProjectResponseDto(savedProject);
  }

  /**
   * Unsaves a project
   * @param projectId - project Id to be unsaved
   * @param unsaveProjectDto - The data transfer object for unsaving a project
   * @param userId - user Id requested to unsave the project
   * @returns A promise resolving to a ProjectResponseDto
   */
  async unsaveProject(
    projectId: number,
    unsaveProjectDto: SaveProjectRequestDto,
    userId: number,
  ): Promise<ProjectResponseDto> {
    const savingProject =
      await this.projectRepository.findProjectById(projectId);

    if (!savingProject) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Project', projectId.toString()),
      );
    }

    // Check saved_by_users array if each user id exists
    for (const id of unsaveProjectDto.saved_by_users) {
      const user = await this.userRepository.getUserById(id);
      if (!user) {
        throw ServiceException.EntityNotFoundException(
          errorMessages.ENTITY_NOT_FOUND('User', id.toString()),
        );
      }
    }

    // Check if current user exists in saved users array
    const savedUsersArr = savingProject.savedByUsers.map((user) => user.userId);

    if (!savedUsersArr.includes(userId)) {
      throw ServiceException.BadRequestException(
        errorMessages.CURRENT_USER_NOT_SAVED_PROJECT,
      );
    }

    // Check if each user in unsaveProjectDto exists in saved users array
    unsaveProjectDto.saved_by_users.forEach((userId) => {
      if (!savedUsersArr.includes(userId)) {
        throw ServiceException.BadRequestException(
          errorMessages.UNSAVE_USER_IN_REQ_BODY_NOT_SAVED_PROJECT,
        );
      }
    });

    // add current user Id if current user doesn't exist in unsaveProjectDto
    if (!unsaveProjectDto.saved_by_users.includes(userId)) {
      unsaveProjectDto.saved_by_users = [
        ...unsaveProjectDto.saved_by_users,
        userId,
      ];
    }

    // remove duplication
    unsaveProjectDto.saved_by_users = [
      ...new Set(unsaveProjectDto.saved_by_users),
    ];

    const unsavedProject = await this.projectRepository.unsaveProject(
      projectId,
      unsaveProjectDto,
    );

    //cache invalidation
    await this.redisService.flushDb();

    return this.projectMapper.projectToProjectResponseDto(unsavedProject);
  }

  /**
   * Creates a join request for a project
   * @param userId - The ID of the user making the join request
   * @param projectId - The ID of the project to join
   * @param jonRequestDto - The join request Body containing roleName and message
   * @returns A promise resolving to the created JoinRequest object
   */
  async createJoinRequest(
    userId: number,
    projectId: number,
    joinRequestDto: CreateJoinRequestBodyDto,
  ): Promise<JoinRequestResponseDto> {
    const project = await this.projectRepository.findProjectById(projectId);
    if (!project) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Project', projectId.toString()),
      );
    }

    // Check if user sent the join request before
    const existingUsers = project.joinRequest.map((user) => user.user.id);
    if (existingUsers.includes(userId)) {
      throw ServiceException.BadRequestException(
        errorMessages.USER_ALREADY_JOINED_REQUEST,
      );
    }

    const joinRequest = await this.projectRepository.createJoinRequest(
      userId,
      projectId,
      joinRequestDto.roleName,
      joinRequestDto.message,
    );

    await this.notificationService.createJoinRequestNotification(
      project.founder?.id,
      project.title,
      projectId,
    );

    return this.joinRequestMapper.joinRequestToJoinRequestResponseDto(
      joinRequest,
    );
  }

  async handleJoinRequest(
    authUserId: number,
    projectId: number,
    requestId: number,
    status: string,
  ): Promise<void> {
    const project = await this.projectRepository.findProjectById(projectId);
    if (!project) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Project', projectId.toString()),
      );
    }

    if (project.founderId !== authUserId) {
      throw ServiceException.ForbiddenException(
        errorMessages.FORBIDDEN('You are not the owner of this project'),
      );
    }

    const joinRequest = await this.projectRepository.findJoinRequest(
      requestId,
      projectId,
    );

    if (!joinRequest) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Join Request', requestId.toString()),
      );
    }

    await this.projectRepository.updateJoinRequestStatus(
      requestId,
      projectId,
      status,
    );

    const user = await this.userService.getUserById(requestId);

    if (status === 'Accepted') {
      await this.projectRepository.createInvolvement(
        requestId,
        projectId,
        joinRequest.roleName,
      );
      await this.mailService.sendMail({
        to: user.email,
        subject: `Your request to join ${project.title} has been accepted`,
        template: 'join-request-accepted',
        templateVariables: {
          projectName: project.title,
          projectOwner: project.founder.username,
        },
      });
    } else {
      await this.mailService.sendMail({
        to: user.email,
        subject: `Your request to join ${project.title} has been declined`,
        template: 'join-request-declined',
        templateVariables: {
          projectName: project.title,
          projectOwner: project.founder.username,
        },
      });
    }
  }
}
