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
import { SearchProjectResponseDto } from './dtos/searchProjectResponse.dto';
import { ProjectResponseDto } from './dtos/projectResponse.dto';
import { CreateProjectRequestDto } from './dtos/createProjectRequest.dto';
import { UpdateProjectRequestDto } from './dtos/updateProjectRequest.dto';
import { SearchProjectDto } from './dtos/searchProject.dto';
import { SaveProjectRequestDto } from './dtos/saveProjectRequest.dto';
import { NotificationService } from '../notification/notification.service';
import { JoinRequestResponseDto } from './dtos/joinRequestResponse.dto';
import { CreateJoinRequestBodyDto } from './dtos/createJoinRequest.dto';
import { Project, JoinRequestStatus } from '@think-storm/contracts';

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
  ) {}

  async getProjectById(id: number): Promise<ProjectResponseDto> {
    const fetchedProject = await this.projectRepository.findProjectById(id);
    if (!fetchedProject) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Project', id.toString()),
      );
    }
    return this.projectMapper.projectToProjectResponseDto(fetchedProject);
  }

  async createProject(
    createProjectDto: CreateProjectRequestDto,
  ): Promise<ProjectResponseDto> {
    await this.userService.getUserById(createProjectDto.founderId);
    const createdProject =
      await this.projectRepository.createProject(createProjectDto);
    await this.redisService.flushDb();
    return this.projectMapper.projectToProjectResponseDto(createdProject);
  }

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
    if (project.founderId !== userId) {
      throw ServiceException.ForbiddenException(
        errorMessages.FORBIDDEN('You are not the owner of this project'),
      );
    }
    const updatedProject = await this.projectRepository.updateProject(body);
    await this.redisService.flushDb();
    return this.projectMapper.projectToProjectResponseDto(updatedProject);
  }

  async searchProjects(
    searchProjectDto: SearchProjectDto,
  ): Promise<SearchProjectResponseDto> {
    const cacheKey = this.generateCacheKey(searchProjectDto);
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
    return this.projectMapper.projectResponseDtoToSearchProjectResponseDtos(
      projectsResult,
      searchProjectDto.page,
      searchProjectDto.limit,
      totalPages,
      totalItems,
    );
  }

  private generateCacheKey(dto: SearchProjectDto): string {
    return JSON.stringify(dto);
  }

  private parseSortConditions(sort?: string): Array<Record<string, string>> {
    if (!sort) return [];
    return sort.split(',').map((sortCondition) => {
      const [field, order] = sortCondition.split('=');
      return { [field]: order };
    });
  }

  async deleteProject(
    deleteProjectDto: GetProjectRequestDto,
    userId: number,
  ): Promise<ProjectResponseDto> {
    const deletingProject = await this.projectRepository.findProjectById(
      deleteProjectDto.id,
    );
    if (!deletingProject) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND(
          'Project',
          deleteProjectDto.id.toString(),
        ),
      );
    }
    if (deletingProject.founderId !== userId) {
      throw ServiceException.ForbiddenException(
        errorMessages.FORBIDDEN('You are not the owner of this project'),
      );
    }
    const deletedProject = await this.projectRepository.deleteProjectById(
      deleteProjectDto.id,
    );
    await this.redisService.flushDb();
    return this.projectMapper.projectToProjectResponseDto(deletedProject);
  }

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
    for (const id of saveProjectDto.saved_by_users) {
      const user = await this.userRepository.getUserById(id);
      if (!user) {
        throw ServiceException.EntityNotFoundException(
          errorMessages.ENTITY_NOT_FOUND('User', id.toString()),
        );
      }
    }
    const savedUsersArr = [];
    for (const user of savingProject.savedByUsers) {
      if (user.userId === userId) {
        throw ServiceException.BadRequestException(
          errorMessages.USER_ALREADY_SAVED_PROJECT,
        );
      }
      savedUsersArr.push(user.userId);
    }
    saveProjectDto.saved_by_users = [
      ...saveProjectDto.saved_by_users,
      ...savedUsersArr,
    ];
    if (!saveProjectDto.saved_by_users.includes(userId)) {
      saveProjectDto.saved_by_users = [
        ...saveProjectDto.saved_by_users,
        userId,
      ];
    }
    saveProjectDto.saved_by_users = [...new Set(saveProjectDto.saved_by_users)];
    const savedProject = await this.projectRepository.saveProject(
      projectId,
      saveProjectDto,
    );
    await this.redisService.flushDb();
    return this.projectMapper.projectToProjectResponseDto(savedProject);
  }

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
    for (const id of unsaveProjectDto.saved_by_users) {
      const user = await this.userRepository.getUserById(id);
      if (!user) {
        throw ServiceException.EntityNotFoundException(
          errorMessages.ENTITY_NOT_FOUND('User', id.toString()),
        );
      }
    }
    const savedUsersArr = savingProject.savedByUsers.map((u) => u.userId);
    if (!savedUsersArr.includes(userId)) {
      throw ServiceException.BadRequestException(
        errorMessages.CURRENT_USER_NOT_SAVED_PROJECT,
      );
    }
    unsaveProjectDto.saved_by_users.forEach((id) => {
      if (!savedUsersArr.includes(id)) {
        throw ServiceException.BadRequestException(
          errorMessages.UNSAVE_USER_IN_REQ_BODY_NOT_SAVED_PROJECT,
        );
      }
    });
    if (!unsaveProjectDto.saved_by_users.includes(userId)) {
      unsaveProjectDto.saved_by_users = [
        ...unsaveProjectDto.saved_by_users,
        userId,
      ];
    }
    unsaveProjectDto.saved_by_users = [
      ...new Set(unsaveProjectDto.saved_by_users),
    ];
    const unsavedProject = await this.projectRepository.unsaveProject(
      projectId,
      unsaveProjectDto,
    );
    await this.redisService.flushDb();
    return this.projectMapper.projectToProjectResponseDto(unsavedProject);
  }

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
    const existingUsers = project.joinRequest.map((jr) => jr.user.id);
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
    requestUserId: number,
    status: JoinRequestStatus,
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
      requestUserId,
      projectId,
    );
    if (!joinRequest) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND(
          'Join Request',
          requestUserId.toString(),
        ),
      );
    }
    if (joinRequest.status !== JoinRequestStatus.Pending) {
      throw ServiceException.BadRequestException(
        errorMessages.JOIN_REQUEST_ALREADY_PROCESSED,
      );
    }
    await this.projectRepository.updateJoinRequestStatus(
      requestUserId,
      projectId,
      status,
    );
    if (status === JoinRequestStatus.Accepted) {
      await this.projectRepository.createInvolvement(
        requestUserId,
        projectId,
        joinRequest.roleName,
      );
      await this.notificationService.createAcceptJoinRequestNotification(
        requestUserId,
        project.title,
        projectId,
      );
    } else if (status === JoinRequestStatus.Rejected) {
      await this.notificationService.createRejectJoinRequestNotification(
        requestUserId,
        project.title,
        projectId,
      );
    }
  }

  async likeProject(
    userId: number,
    projectId: number,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findProjectById(projectId);
    if (!project) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Project', projectId.toString()),
      );
    }
    const existingLike = await this.projectRepository.findLike(
      userId,
      projectId,
    );
    if (existingLike) {
      throw ServiceException.BadRequestException(
        errorMessages.USER_ALREADY_LIKED_PROJECT,
      );
    }
    await this.projectRepository.likeProject(userId, projectId);
    const updated = await this.projectRepository.findProjectById(projectId);
    if (!updated) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Project', projectId.toString()),
      );
    }
    return this.projectMapper.projectToProjectResponseDto(updated);
  }

  async unlikeProject(
    userId: number,
    projectId: number,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findProjectById(projectId);
    if (!project) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Project', projectId.toString()),
      );
    }
    const existingLike = await this.projectRepository.findLike(
      userId,
      projectId,
    );
    if (!existingLike) {
      throw ServiceException.BadRequestException(
        errorMessages.USER_NOT_LIKED_PROJECT,
      );
    }
    await this.projectRepository.unlikeProject(userId, projectId);
    const updated = await this.projectRepository.findProjectById(projectId);
    if (!updated) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Project', projectId.toString()),
      );
    }
    return this.projectMapper.projectToProjectResponseDto(updated);
  }
}
