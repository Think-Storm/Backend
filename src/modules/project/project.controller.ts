import {
  Controller,
  Get,
  Param,
  HttpCode,
  Post,
  Body,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { GetProjectRequestDto } from './dtos/getProjectRequest.dto';
import { ProjectResponseDto } from './dtos/projectResponse.dto';
import { CreateProjectRequestDto } from './dtos/createProjectRequest.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@ApiTags('projects')
@Controller()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @HttpCode(200)
  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Get project success',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  async getProjectById(
    @Param() param: GetProjectRequestDto,
  ): Promise<ProjectResponseDto> {
    return this.projectService.getProjectById(param.id);
  }

  @HttpCode(201)
  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({ type: CreateProjectRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Create project success',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Founder of the project not found',
  })
  async createProject(@Body() body: CreateProjectRequestDto) {
    return this.projectService.createProject(body);
  }

  @HttpCode(200)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete project by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Delete project success',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Target project for deletion was not found',
  })
  @UseGuards(JwtAuthGuard)
  async deleteProject(
    @Param() deleteProjectDto: GetProjectRequestDto,
    @Request() req,
  ) {
    return this.projectService.deleteProject(deleteProjectDto, req.user.id);
  }
}
