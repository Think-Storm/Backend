import { Controller, Get, Param, HttpCode } from '@nestjs/common';
import { ProjectService } from './project.service';
import { GetProjectRequestDto } from './dtos/getProjectRequest.dto';
import { GetProjectResponseDto } from './dtos/getProjectResponse.dto';

@Controller()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @HttpCode(200)
  @Get(':id')
  async getProjectById(
    @Param() param: GetProjectRequestDto,
  ): Promise<GetProjectResponseDto> {
    return this.projectService.getProjectById(param.id);
  }
}
