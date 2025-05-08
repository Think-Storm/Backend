import {
  Controller,
  Get,
  Param,
  HttpCode,
  Post,
  Body,
  Put,
  UseGuards,
  Query,
  Delete,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { GetProjectRequestDto } from './dtos/getProjectRequest.dto';
import { ProjectResponseDto } from './dtos/projectResponse.dto';
import { CreateProjectRequestDto } from './dtos/createProjectRequest.dto';
import { UpdateProjectRequestDto } from './dtos/updateProjectRequest.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { SearchProjectDto } from './dtos/searchProject.dto';
import { GetUser } from '../auth/decorators/getUser.decorator';
@ApiTags('projects')
@Controller()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @HttpCode(200)
  @Get('search')
  @ApiOperation({ summary: 'Get projects filtered by query string' })
  @ApiResponse({
    status: 200,
    description: 'Get projects filtered by query success',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'An error occurred due to the format of your queries',
  })
  @ApiResponse({
    status: 500,
    description: 'An error occurred while searching projects for your queries',
  })
  async searchProjects(
    @Query() searchProjectDto: SearchProjectDto,
  ): Promise<ProjectResponseDto[]> {
    return this.projectService.searchProjects(searchProjectDto);
  }

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
    return await this.projectService.createProject(body);
  }

  @HttpCode(200)
  @Put()
  @ApiOperation({ summary: 'Update project details' })
  @ApiBody({ type: UpdateProjectRequestDto })
  @ApiResponse({
    status: 204,
    description: 'Update project success',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only the project owner can update the project',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  @UseGuards(JwtAuthGuard)
  async updateProject(
    @Body() body: UpdateProjectRequestDto,
    @GetUser() user: any,
  ): Promise<ProjectResponseDto> {
    return await this.projectService.updateProject(body, user.id);
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
    status: 403,
    description: 'Forbidden. Only the project owner can delete the project',
  })
  @ApiResponse({
    status: 404,
    description: 'Target project for deletion was not found',
  })
  @UseGuards(JwtAuthGuard)
  async deleteProject(
    @Param() deleteProjectDto: GetProjectRequestDto,
    @GetUser() user: any,
  ) {
    return await this.projectService.deleteProject(deleteProjectDto, user.id);
  }
}
