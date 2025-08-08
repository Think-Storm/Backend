import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, JoinRequest } from '@prisma/client';
import { CreateProjectRequestDto } from './dtos/createProjectRequest.dto';
import { errorMessages } from '../../common/enums/errorMessages';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { UpdateProjectRequestDto } from './dtos/updateProjectRequest.dto';
import { SearchProjectDto } from './dtos/searchProject.dto';
import { PrismaProjectWithRelations } from './types/project.types';
import { SaveProjectRequestDto } from './dtos/saveProjectRequest.dto';

@Injectable()
export class ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a Project by id
   * @param id - The id of the Project to find
   * @returns A promise resolving to a Project object or null
   */
  async findProjectById(
    id: number,
  ): Promise<PrismaProjectWithRelations | null> {
    try {
      return await this.prisma.project.findUnique({
        where: {
          id: id,
        },
        include: {
          language: true,
          users: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
          founder: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
          domainLabels: {
            include: {
              label: {
                select: {
                  name: true,
                },
              },
            },
          },
          technicalLabels: {
            include: {
              label: {
                select: {
                  name: true,
                },
              },
            },
          },
          like: true,
          involvement: true,
          joinRequest: {
            include: {
              user: {
                omit: {
                  password: true,
                  passwordSalt: true,
                  passwordChangedAt: true,
                },
              },
            },
          },
          savedByUsers: {
            include: {
              user: {
                omit: {
                  password: true,
                  passwordSalt: true,
                  passwordChangedAt: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_FINDING_PROJECTS,
        error,
      );
    }
  }

  /**
   * Creates a new project
   * @param createProjectRequestDto - The data transfer object containing project creation details
   * @param passwordSalt - The password salt for hashing
   * @returns A promise resolving to the created Project object
   */
  async createProject(
    createProjectRequestDto: CreateProjectRequestDto,
  ): Promise<PrismaProjectWithRelations> {
    try {
      return await this.prisma.project.create({
        data: {
          title: createProjectRequestDto.title,
          description: createProjectRequestDto.description,
          goal: createProjectRequestDto.goal,
          status: createProjectRequestDto.status,
          milestone: createProjectRequestDto.milestone,
          founder: {
            connect: {
              id: createProjectRequestDto.founderId,
            },
          },
          language: {
            connect: {
              name: createProjectRequestDto.languageName,
            },
          },
          domainLabels: {
            create: createProjectRequestDto.domainLabels.map((domainLabel) => {
              return {
                label: {
                  connect: {
                    name: domainLabel,
                  },
                },
              };
            }),
          },
          technicalLabels: {
            create: createProjectRequestDto.technicalLabels.map(
              (technicalLabel) => {
                return {
                  label: {
                    connect: {
                      name: technicalLabel,
                    },
                  },
                };
              },
            ),
          },
        },
        include: {
          language: true,
          users: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
          founder: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
          domainLabels: {
            include: {
              label: {
                select: {
                  name: true,
                },
              },
            },
          },
          technicalLabels: {
            include: {
              label: {
                select: {
                  name: true,
                },
              },
            },
          },
          like: true,
          involvement: true,
          joinRequest: {
            include: {
              user: {
                omit: {
                  password: true,
                  passwordSalt: true,
                  passwordChangedAt: true,
                },
              },
            },
          },
          savedByUsers: {
            include: {
              user: {
                omit: {
                  password: true,
                  passwordSalt: true,
                  passwordChangedAt: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_CREATING_PROJECT_IN_DB,
        error,
      );
    }
  }

  /**
   * Updates a project
   * @param id - The id of the project to update
   * @param updateProjectRequestDto - The data transfer object containing project update details
   * @returns A promise resolving to the updated Project object
   */
  async updateProject(
    updateProjectRequestDto: UpdateProjectRequestDto,
  ): Promise<PrismaProjectWithRelations> {
    try {
      return await this.prisma.project.update({
        where: { id: updateProjectRequestDto.id },
        data: {
          title: updateProjectRequestDto.title,
          description: updateProjectRequestDto.description,
          status: updateProjectRequestDto.status,
          milestone: updateProjectRequestDto.milestone,
          goal: updateProjectRequestDto.goal,
          language: {
            connect: {
              name: updateProjectRequestDto.languageName,
            },
          },
          domainLabels: {
            deleteMany: {},
            create: updateProjectRequestDto.domainLabels.map((domainLabel) => ({
              label: {
                connect: {
                  name: domainLabel,
                },
              },
            })),
          },
          technicalLabels: {
            deleteMany: {},
            create: updateProjectRequestDto.technicalLabels.map(
              (technicalLabel) => ({
                label: {
                  connect: {
                    name: technicalLabel,
                  },
                },
              }),
            ),
          },
        },
        include: {
          language: true,
          users: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
          founder: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
          domainLabels: {
            include: {
              label: {
                select: {
                  name: true,
                },
              },
            },
          },
          technicalLabels: {
            include: {
              label: {
                select: {
                  name: true,
                },
              },
            },
          },
          like: true,
          involvement: true,
          joinRequest: {
            include: {
              user: {
                omit: {
                  password: true,
                  passwordSalt: true,
                  passwordChangedAt: true,
                },
              },
            },
          },
          savedByUsers: {
            include: {
              user: {
                omit: {
                  password: true,
                  passwordSalt: true,
                  passwordChangedAt: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_UPDATING_PROJECTS,
        error,
      );
    }
  }

  /**
   * Search projects by query
   * @param searchProjectDto - The data transfer object containing project query details
   * @returns A promise resolving to the searched Project objects
   */
  async searchProjects(
    searchProjectDto: SearchProjectDto,
    sortByArr: Array<object>,
  ): Promise<{ projects: PrismaProjectWithRelations[]; totalItems: number }> {
    try {
      const whereClause: Prisma.ProjectWhereInput = {
        AND: [
          {
            title: {
              contains: searchProjectDto.title,
              mode: Prisma.QueryMode.insensitive,
            },
            description: {
              contains: searchProjectDto.description,
              mode: Prisma.QueryMode.insensitive,
            },
            languageName: searchProjectDto.languageName,
            status: searchProjectDto.status,
            goal: searchProjectDto.goal,
            milestone: {
              gte: searchProjectDto.mileStoneFrom,
              lte: searchProjectDto.mileStoneTo,
            },
            createdAt: {
              gte: searchProjectDto.createdAtFrom,
              lte: searchProjectDto.createdAtTo,
            },
            lastUpdatedAt: {
              gte: searchProjectDto.lastUpdatedAtFrom,
              lte: searchProjectDto.lastUpdatedAtTo,
            },
            technicalLabels: {
              some: {
                OR: searchProjectDto.technicalLabels
                  ?.split(',')
                  .map((technicalLabel) => ({ labelName: technicalLabel })),
              },
            },
            domainLabels: {
              some: {
                OR: searchProjectDto.domainLabels
                  ?.split(',')
                  .map((domainLabel) => ({ labelName: domainLabel })),
              },
            },
          },
          {
            OR: [
              {
                title: {
                  contains: searchProjectDto.searchQuery,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                description: {
                  contains: searchProjectDto.searchQuery,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          },
        ],
      };

      const [projects, totalItems] = await this.prisma.$transaction([
        this.prisma.project.findMany({
          skip: (searchProjectDto.page - 1) * searchProjectDto.limit,
          take: searchProjectDto.limit,
          where: whereClause,
          include: {
            language: true,
            users: {
              omit: {
                password: true,
                passwordSalt: true,
                passwordChangedAt: true,
              },
            },
            founder: {
              omit: {
                password: true,
                passwordSalt: true,
                passwordChangedAt: true,
              },
            },
            domainLabels: {
              include: {
                label: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            technicalLabels: {
              include: {
                label: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            like: true,
            involvement: true,
            joinRequest: {
              include: {
                user: {
                  omit: {
                    password: true,
                    passwordSalt: true,
                    passwordChangedAt: true,
                  },
                },
              },
            },
            savedByUsers: {
              include: {
                user: {
                  omit: {
                    password: true,
                    passwordSalt: true,
                    passwordChangedAt: true,
                  },
                },
              },
            },
          },
          orderBy: sortByArr,
        }),
        this.prisma.project.count({ where: whereClause }),
      ]);

      return { projects, totalItems };
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_SEARCHING_PROJECTS,
        error,
      );
    }
  }
  /**
   * Deletes a Project by id
   * @param id - The id of the Project to delete
   * @returns A promise resolving to a Project object or null
   */
  async deleteProjectById(id: number): Promise<PrismaProjectWithRelations> {
    try {
      return await this.prisma.project.delete({
        where: {
          id: id,
        },
        include: {
          language: true,
          users: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
          founder: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
          domainLabels: {
            include: {
              label: {
                select: {
                  name: true,
                },
              },
            },
          },
          technicalLabels: {
            include: {
              label: {
                select: {
                  name: true,
                },
              },
            },
          },
          like: true,
          involvement: true,
          joinRequest: {
            include: {
              user: {
                omit: {
                  password: true,
                  passwordSalt: true,
                  passwordChangedAt: true,
                },
              },
            },
          },
          savedByUsers: {
            include: {
              user: {
                omit: {
                  password: true,
                  passwordSalt: true,
                  passwordChangedAt: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_DELETING_PROJECTS,
        error,
      );
    }
  }

  /**
   * Save a Project by userId
   * @param projectId - The id of the Project to save
   * @param saveProjectDto - The data transfer object containing saved users Id
   * @returns A promise resolving to a Project object or null
   */
  async saveProject(
    projectId: number,
    saveProjectDto: SaveProjectRequestDto,
  ): Promise<PrismaProjectWithRelations | null> {
    const { saved_by_users } = saveProjectDto;
    try {
      return await this.prisma.project.update({
        where: {
          id: projectId,
        },
        data: {
          savedByUsers: {
            deleteMany: {},
            create: saved_by_users.map((userId) => ({
              user: { connect: { id: userId } },
            })),
          },
        },
        include: {
          language: true,
          users: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
          founder: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
          domainLabels: {
            include: {
              label: {
                select: {
                  name: true,
                },
              },
            },
          },
          technicalLabels: {
            include: {
              label: {
                select: {
                  name: true,
                },
              },
            },
          },
          like: true,
          involvement: true,
          joinRequest: {
            include: {
              user: {
                omit: {
                  password: true,
                  passwordSalt: true,
                  passwordChangedAt: true,
                },
              },
            },
          },
          savedByUsers: {
            include: {
              user: {
                omit: {
                  password: true,
                  passwordSalt: true,
                  passwordChangedAt: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_SAVING_PROJECTS,
        error,
      );
    }
  }

  /**
   * Unsave a Project by userId
   * @param projectId - The id of the Project to unsave
   * @param unsaveProjectDto - The data transfer object containing unsaved users Id
   * @returns A promise resolving to a Project object or null
   */
  async unsaveProject(
    projectId: number,
    unsaveProjectDto: SaveProjectRequestDto,
  ): Promise<PrismaProjectWithRelations | null> {
    const { saved_by_users } = unsaveProjectDto;
    try {
      return await this.prisma.project.update({
        where: {
          id: projectId,
        },
        data: {
          savedByUsers: {
            deleteMany: {
              userId: {
                in: saved_by_users,
              },
            },
          },
        },
        include: {
          language: true,
          users: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
          founder: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
          domainLabels: {
            include: {
              label: {
                select: {
                  name: true,
                },
              },
            },
          },
          technicalLabels: {
            include: {
              label: {
                select: {
                  name: true,
                },
              },
            },
          },
          like: true,
          involvement: true,
          joinRequest: {
            include: {
              user: {
                omit: {
                  password: true,
                  passwordSalt: true,
                  passwordChangedAt: true,
                },
              },
            },
          },
          savedByUsers: {
            include: {
              user: {
                omit: {
                  password: true,
                  passwordSalt: true,
                  passwordChangedAt: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_UNSAVING_PROJECTS,
        error,
      );
    }
  }

  /**
   * Creates a join request for a project
   * @param userId - The ID of the user making the join request
   * @param projectId - The ID of the project to join
   * @param roleName - The role name for the join request
   * @param message - Optional message for the join request
   * @returns A promise resolving to the created JoinRequest object
   */
  async createJoinRequest(
    userId: number,
    projectId: number,
    roleName: string,
    message?: string,
  ): Promise<JoinRequest> {
    try {
      return await this.prisma.joinRequest.create({
        data: {
          userId: userId,
          projectId: projectId,
          roleName: roleName,
          message: message,
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_CREATING_JOIN_REQUEST,
        error,
      );
    }
  }
}
