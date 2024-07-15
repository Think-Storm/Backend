import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Project } from '@prisma/client';
import { CreateProjectRequestDto } from './dtos/createProjectRequest.dto';
import { errorMessages } from '../../common/enums/errorMessages';
import { ServiceException } from '../../common/exception-filter/serviceException';

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
          labels: createProjectRequestDto.labels,
          goal: createProjectRequestDto.goal,
          status: createProjectRequestDto.status,
          languageCode: createProjectRequestDto.languageCode,
          milestone: createProjectRequestDto.milestone,
        },
        include: { language: true, users: true, founder: true },
      });
    } catch (error) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ERROR_CREATING_PROJECT_IN_DB,
      );
    }
  }
}
