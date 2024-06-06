import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Project } from '@prisma/client';

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
      include: { language: true, users: true },
    });
  }
}
