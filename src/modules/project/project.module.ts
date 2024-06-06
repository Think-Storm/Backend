import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectRepository } from './project.repository';
import { ProjectMapper } from './dtos/project.mapper';

/**
 * The ProjectModule is responsible for managing the project-related components
 * and services including controllers, services, repositories, and mappers.
 */
@Module({
  imports: [],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectRepository, PrismaService, ProjectMapper],
})
export class ProjectModule {}
