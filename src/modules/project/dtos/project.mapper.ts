import { Project } from '@prisma/client';
import { stringToEnum, Goal, ProjectStatus } from '@think-storm/contracts';
import { ProjectResponseDto } from './projectResponse.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SearchProjectResponseDto } from './searchProjectResponse.dto';
import { ProjectWithLabels } from '../types/project.types';

export class ProjectMapper {
  /**
   * Maps a Project entity to a ProjectResponseDto
   * @param project - The Project entity to be mapped
   * @returns A ProjectResponseDto with the mapped data
   */
  @ApiProperty({ type: ProjectResponseDto })
  projectToProjectResponseDto(project: ProjectWithLabels): ProjectResponseDto {
    const plainProject = instanceToPlain(project);

    // Transform domain labels to string array if they exist and have the complex structure
    if (
      project.domainLabels?.length > 0 &&
      'label' in project.domainLabels[0]
    ) {
      plainProject.domainLabels = project.domainLabels.map(
        (dl) => dl.label.name,
      );
    }

    // Transform technical labels to string array if they exist and have the complex structure
    if (
      project.technicalLabels?.length > 0 &&
      'label' in project.technicalLabels[0]
    ) {
      plainProject.technicalLabels = project.technicalLabels.map(
        (tl) => tl.label.name,
      );
    }

    // Transform string goal to enum
    if (plainProject.goal) {
      plainProject.goal = stringToEnum(plainProject.goal, Goal);
    }

    // Transform string status to enum
    if (plainProject.status) {
      plainProject.status = stringToEnum(plainProject.status, ProjectStatus);
    }

    // Transform saved by users array if they exist and have the complex structure
    if (project.savedByUsers?.length > 0 && 'user' in project.savedByUsers[0]) {
      plainProject.savedByUsers = project.savedByUsers.map((user) => user.user);
    }

    return plainToInstance(ProjectResponseDto, plainProject, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Maps a Project entity to a ProjectResponseDto[]
   * @param project - The Project entity to be mapped
   * @returns A ProjectResponseDto with the mapped data
   */
  @ApiProperty({ type: ProjectResponseDto })
  projectsToProjectResponseDtos(projects: Project[]): ProjectResponseDto[] {
    return projects.map((project) =>
      plainToInstance(ProjectResponseDto, instanceToPlain(project), {
        excludeExtraneousValues: true,
      }),
    );
  }

  /**
   * Maps a ProjectResponseDto entity to a SearchProjectResponseDto[]
   * @param ProjectResponseDto - The ProjectResponseDto to be mapped
   * @param page - Current page of the result
   * @param limit - Number of items for each page
   * @param totalPages - Total number of pages
   * @param totalItems - Total number of items
   * @returns A SearchProjectResponseDto with the mapped data
   */
  @ApiProperty({ type: SearchProjectResponseDto })
  projectResponseDtoToSearchProjectResponseDtos(
    projects: ProjectResponseDto[],
    page: number,
    limit: number,
    totalPages: number,
    totalItems: number,
  ): SearchProjectResponseDto {
    const searchProjectResponseDto = new SearchProjectResponseDto();
    searchProjectResponseDto.projects = projects;
    searchProjectResponseDto.page = page;
    searchProjectResponseDto.limit = limit;
    searchProjectResponseDto.totalPages = totalPages;
    searchProjectResponseDto.totalItems = totalItems;
    return searchProjectResponseDto;
  }
}
