import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Project } from '@prisma/client';
import { CreateProjectRequestDto } from './dtos/createProjectRequest.dto';
import { errorMessages } from '../../common/enums/errorMessages';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { UpdateProjectRequestDto } from './dtos/updateProjectRequest.dto';

@Injectable()
export class ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a Project by id
   * @param id - The id of the Project to find
   * @returns A promise resolving to a Project object or null
   */
  async findProjectById(id: number): Promise<Project> {
    return this.prisma.project.findUnique({
      where: {
        id: id,
      },
      include: { language: true, users: true, founder: true },
    });
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
      return this.prisma.project.create({
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
          founder: true,
          domainLabels: true,
          technicalLabels: true,
          like: true,
          involvement: true,
          joinRequest: true,
        },
      });
    } catch (error) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ERROR_CREATING_PROJECT_IN_DB,
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
      return this.prisma.project.update({
        where: { id: updateProjectRequestDto.id },
        data: {
          title: updateProjectRequestDto.title,
          description: updateProjectRequestDto.description,
          status: updateProjectRequestDto.status,
          languageCode: updateProjectRequestDto.languageCode,
          milestone: updateProjectRequestDto.milestone,
          goal: updateProjectRequestDto.goal,
          domainLabels: {
            set: updateProjectRequestDto.domainLabels?.map((domainLabel) => ({
              projectId_labelName: {
                projectId: updateProjectRequestDto.id,
                labelName: domainLabel,
              },
            })),
          },
          technicalLabels: {
            set: updateProjectRequestDto.technicalLabels?.map(
              (technicalLabel) => ({
                projectId_labelName: {
                  projectId: updateProjectRequestDto.id,
                  labelName: technicalLabel,
                },
              }),
            ),
          },
        },
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
      });
    } catch (error) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND(
          'Project',
          updateProjectRequestDto.id.toString(),
        ),
      );
    }
  }
}
