import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Project } from '@prisma/client';
import { CreateProjectRequestDto } from './dtos/createProjectRequest.dto';
import { errorMessages } from '../../common/enums/errorMessages';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { UpdateProjectRequestDto } from './dtos/updateProjectRequest.dto';
import { SearchProjectDto } from './dtos/searchProject.dto';
import { ProjectWithRelations } from './types/project.types';
import { SaveProjectRequestDto } from './dtos/saveProjectRequest.dto';

@Injectable()
export class ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a Project by id
   * @param id - The id of the Project to find
   * @returns A promise resolving to a Project object or null
   */
  async findProjectById(id: number): Promise<ProjectWithRelations | null> {
    try {
      return await this.prisma.project.findUnique({
        where: {
          id: id,
        },
        include: {
          language: true,
          users: true,
          founder: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
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
  ): Promise<Project> {
    try {
      return await this.prisma.project.create({
        data: {
          founderId: createProjectRequestDto.founderId,
          title: createProjectRequestDto.title,
          description: createProjectRequestDto.description,
          goal: createProjectRequestDto.goal,
          status: createProjectRequestDto.status,
          languageCode: createProjectRequestDto.languageCode,
          milestone: createProjectRequestDto.milestone,
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
          users: true,
          founder: {
            omit: {
              password: true,
              passwordSalt: true,
              passwordChangedAt: true,
            },
          },
          domainLabels: true,
          technicalLabels: true,
          like: true,
          involvement: true,
          joinRequest: true,
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
  ): Promise<Project> {
    try {
      return await this.prisma.project.update({
        where: { id: updateProjectRequestDto.id },
        data: {
          title: updateProjectRequestDto.title,
          description: updateProjectRequestDto.description,
          status: updateProjectRequestDto.status,
          languageCode: updateProjectRequestDto.languageCode,
          milestone: updateProjectRequestDto.milestone,
          goal: updateProjectRequestDto.goal,
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
              label: true,
            },
          },
          technicalLabels: {
            include: {
              label: true,
            },
          },
          like: true,
          involvement: true,
          joinRequest: true,
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
  ): Promise<{ projects: Project[]; totalItems: number }> {
    try {
      const whereClause = {
        title: {
          contains: searchProjectDto.title,
          mode: Prisma.QueryMode.insensitive,
        },
        languageCode: searchProjectDto.languageCode,
        description: {
          contains: searchProjectDto.description,
          mode: Prisma.QueryMode.insensitive,
        },
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
              .map((technicalLabel) => {
                return {
                  labelName: technicalLabel,
                };
              }),
          },
        },
        domainLabels: {
          some: {
            OR: searchProjectDto.domainLabels?.split(',').map((domainLabel) => {
              return {
                labelName: domainLabel,
              };
            }),
          },
        },
      };

      const [projects, totalItems] = await this.prisma.$transaction([
        this.prisma.project.findMany({
          skip: (searchProjectDto.page - 1) * searchProjectDto.limit,
          take: searchProjectDto.limit,
          where: whereClause,
          include: {
            language: true,
            users: true,
            founder: true,
            domainLabels: true,
            technicalLabels: true,
            like: true,
            involvement: true,
            joinRequest: true,
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
  async deleteProjectById(id: number): Promise<Project> {
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
              label: true,
            },
          },
          technicalLabels: {
            include: {
              label: true,
            },
          },
          like: true,
          involvement: true,
          joinRequest: true,
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
  ): Promise<ProjectWithRelations | null> {
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
              label: true,
            },
          },
          technicalLabels: {
            include: {
              label: true,
            },
          },
          like: true,
          involvement: true,
          joinRequest: true,
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
}
