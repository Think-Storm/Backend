import {
  Project,
  ProjectDomainLabel,
  ProjectTechnicalLabel,
  User,
  Language,
  Like,
  Involvement,
  JoinRequest,
} from '@prisma/client';
import { ProjectResponseDto } from './projectResponse.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

type ProjectWithLabels = Project & {
  domainLabels?: (ProjectDomainLabel & {
    label: { name: string };
  })[];
  technicalLabels?: (ProjectTechnicalLabel & {
    label: { name: string };
  })[];
  language?: Language;
  users?: User[];
  founder?: User;
  like?: Like[];
  involvement?: Involvement[];
  joinRequest?: JoinRequest[];
};

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

    return plainToInstance(ProjectResponseDto, plainProject, {
      excludeExtraneousValues: true,
    });
  }
}
