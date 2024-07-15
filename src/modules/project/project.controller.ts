import { Controller, Get, Param, HttpCode, Post, Body } from '@nestjs/common';
import { ProjectService } from './project.service';
import { GetProjectRequestDto } from './dtos/getProjectRequest.dto';
import { ProjectResponseDto } from './dtos/projectResponse.dto';
import { CreateProjectRequestDto } from './dtos/createProjectRequest.dto';

@Controller()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @HttpCode(200)
  @Get(':id')
  async getProjectById(
    @Param() param: GetProjectRequestDto,
  ): Promise<ProjectResponseDto> {
    return this.projectService.getProjectById(param.id);
  }

  @HttpCode(201)
  @Post()
  async createProject(@Body() body: CreateProjectRequestDto) {
    return this.projectService.createProject(body);
  }
}
