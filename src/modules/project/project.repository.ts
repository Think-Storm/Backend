import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { JoinRequest, Like } from '@think-storm/contracts';
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

  async findProjectById(
    id: number,
  ): Promise<PrismaProjectWithRelations | null> {
    try {
      return await this.prisma.project.findUnique({
        where: { id },
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
            include: { label: { select: { name: true } } },
          },
          technicalLabels: {
            include: { label: { select: { name: true } } },
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
          founder: { connect: { id: createProjectRequestDto.founderId } },
          language: { connect: { name: createProjectRequestDto.languageName } },
          domainLabels: {
            create: createProjectRequestDto.domainLabels.map((domainLabel) => ({
              label: { connect: { name: domainLabel } },
            })),
          },
          technicalLabels: {
            create: createProjectRequestDto.technicalLabels.map(
              (technicalLabel) => ({
                label: { connect: { name: technicalLabel } },
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
            include: { label: { select: { name: true } } },
          },
          technicalLabels: {
            include: { label: { select: { name: true } } },
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
          language: { connect: { name: updateProjectRequestDto.languageName } },
          domainLabels: {
            deleteMany: {},
            create: updateProjectRequestDto.domainLabels.map((domainLabel) => ({
              label: { connect: { name: domainLabel } },
            })),
          },
          technicalLabels: {
            deleteMany: {},
            create: updateProjectRequestDto.technicalLabels.map(
              (technicalLabel) => ({
                label: { connect: { name: technicalLabel } },
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
            include: { label: { select: { name: true } } },
          },
          technicalLabels: {
            include: { label: { select: { name: true } } },
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

      const include = {
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
        domainLabels: { include: { label: { select: { name: true } } } },
        technicalLabels: { include: { label: { select: { name: true } } } },
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
      };

      const [projects, totalItems] = await this.prisma.$transaction([
        this.prisma.project.findMany({
          skip: (searchProjectDto.page - 1) * searchProjectDto.limit,
          take: searchProjectDto.limit,
          where: whereClause,
          include,
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

  async deleteProjectById(id: number): Promise<PrismaProjectWithRelations> {
    try {
      return await this.prisma.project.delete({
        where: { id },
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
          domainLabels: { include: { label: { select: { name: true } } } },
          technicalLabels: { include: { label: { select: { name: true } } } },
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

  async saveProject(
    projectId: number,
    saveProjectDto: SaveProjectRequestDto,
  ): Promise<PrismaProjectWithRelations | null> {
    const { saved_by_users } = saveProjectDto;
    try {
      return await this.prisma.project.update({
        where: { id: projectId },
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
          domainLabels: { include: { label: { select: { name: true } } } },
          technicalLabels: { include: { label: { select: { name: true } } } },
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

  async unsaveProject(
    projectId: number,
    unsaveProjectDto: SaveProjectRequestDto,
  ): Promise<PrismaProjectWithRelations | null> {
    const { saved_by_users } = unsaveProjectDto;
    try {
      return await this.prisma.project.update({
        where: { id: projectId },
        data: {
          savedByUsers: {
            deleteMany: { userId: { in: saved_by_users } },
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
          domainLabels: { include: { label: { select: { name: true } } } },
          technicalLabels: { include: { label: { select: { name: true } } } },
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

  async createJoinRequest(
    userId: number,
    projectId: number,
    roleName: string,
    message?: string,
  ): Promise<JoinRequest> {
    try {
      return await this.prisma.joinRequest.create({
        data: { userId, projectId, roleName, message },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_CREATING_JOIN_REQUEST,
        error,
      );
    }
  }

  async findJoinRequest(
    userId: number,
    projectId: number,
  ): Promise<JoinRequest | null> {
    return this.prisma.joinRequest.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
  }

  async updateJoinRequestStatus(
    userId: number,
    projectId: number,
    status: string,
  ): Promise<JoinRequest> {
    try {
      return await this.prisma.joinRequest.update({
        where: { userId_projectId: { userId, projectId } },
        data: { status },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_UPDATING_JOIN_REQUEST,
        error,
      );
    }
  }

  async createInvolvement(
    userId: number,
    projectId: number,
    roleName: string,
  ): Promise<void> {
    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        involvement: { create: { userId, roleName } },
        users: { connect: { id: userId } },
      },
    });
  }

  async findLike(userId: number, projectId: number): Promise<Like | null> {
    return this.prisma.like.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
  }

  async likeProject(userId: number, projectId: number): Promise<Like> {
    try {
      return await this.prisma.like.create({
        data: { userId, projectId },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_LIKING_PROJECT,
        error,
      );
    }
  }

  async unlikeProject(userId: number, projectId: number): Promise<Like> {
    try {
      return await this.prisma.like.delete({
        where: { userId_projectId: { userId, projectId } },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_UNLIKING_PROJECT,
        error,
      );
    }
  }
}
