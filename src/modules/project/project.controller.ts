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
  Patch,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { GetProjectRequestDto } from './dtos/getProjectRequest.dto';
import { ProjectResponseDto } from './dtos/projectResponse.dto';
import { CreateProjectRequestDto } from './dtos/createProjectRequest.dto';
import { UpdateProjectRequestDto } from './dtos/updateProjectRequest.dto';
import { SearchProjectDto } from './dtos/searchProject.dto';
import { CreateJoinRequestBodyDto } from './dtos/createJoinRequest.dto';
import { UpdateJoinRequestDto } from './dtos/updateJoinRequest.dto';
import { JoinRequestResponseDto } from './dtos/joinRequestResponse.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { GetUser } from '../auth/decorators/getUser.decorator';
import { SearchProjectResponseDto } from './dtos/searchProjectResponse.dto';
import { SaveProjectRequestDto } from './dtos/saveProjectRequest.dto';

@ApiTags('projects')
@Controller()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @HttpCode(200)
  @Get('search')
  @ApiOperation({ summary: 'Get projects filtered by query string' })
  @ApiResponse({ status: 200, description: 'Get projects filtered by query success', type: ProjectResponseDto })
  @ApiResponse({ status: 400, description: 'An error occurred due to the format of your queries' })
  @ApiResponse({ status: 500, description: 'An error occurred while searching projects for your queries' })
  async searchProjects(
    @Query() searchProjectDto: SearchProjectDto,
  ): Promise<SearchProjectResponseDto> {
    return await this.projectService.searchProjects(searchProjectDto);
  }

  @HttpCode(200)
  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Get project success', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectById(
    @Param() param: GetProjectRequestDto,
  ): Promise<ProjectResponseDto> {
    return await this.projectService.getProjectById(param.id);
  }

  @HttpCode(201)
  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({ type: CreateProjectRequestDto })
  @ApiResponse({ status: 201, description: 'Create project success', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Founder of the project not found' })
  async createProject(@Body() body: CreateProjectRequestDto) {
    return await this.projectService.createProject(body);
  }

  @HttpCode(200)
  @Put()
  @ApiOperation({ summary: 'Update project details' })
  @ApiBody({ type: UpdateProjectRequestDto })
  @ApiResponse({ status: 200, description: 'Update project success', type: ProjectResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden. Only the project owner can update the project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
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
  @ApiResponse({ status: 200, description: 'Delete project success', type: ProjectResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden. Only the project owner can delete the project' })
  @ApiResponse({ status: 404, description: 'Target project for deletion was not found' })
  @UseGuards(JwtAuthGuard)
  async deleteProject(
    @Param() deleteProjectDto: GetProjectRequestDto,
    @GetUser() user: any,
  ) {
    return await this.projectService.deleteProject(deleteProjectDto, user.id);
  }

  @HttpCode(201)
  @Post(':id/save')
  @ApiOperation({ summary: 'Save a project' })
  @ApiParam({ name: 'id', required: true, description: 'Project ID' })
  @ApiBody({ type: SaveProjectRequestDto })
  @ApiResponse({ status: 201, description: 'Save project success', type: ProjectResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden. User can save the project only once.' })
  @ApiResponse({ status: 404, description: 'Project or User not found' })
  @UseGuards(JwtAuthGuard)
  async saveProject(
    @Param('id') projectId: number,
    @Body() saveProjectDto: SaveProjectRequestDto,
    @GetUser() user: any,
  ): Promise<ProjectResponseDto> {
    return await this.projectService.saveProject(+projectId, saveProjectDto, user.id);
  }

  @HttpCode(200)
  @Patch(':id/unsave')
  @ApiOperation({ summary: 'Unsave a project' })
  @ApiParam({ name: 'id', required: true, description: 'Project ID' })
  @ApiBody({ type: SaveProjectRequestDto })
  @ApiResponse({ status: 200, description: 'Unsave project success', type: ProjectResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden. User can unsave the project only once.' })
  @ApiResponse({ status: 404, description: 'Project or User not found' })
  @UseGuards(JwtAuthGuard)
  async unsaveProject(
    @Param('id') projectId: number,
    @Body() unsaveProjectDto: SaveProjectRequestDto,
    @GetUser() user: any,
  ): Promise<ProjectResponseDto> {
    return await this.projectService.unsaveProject(+projectId, unsaveProjectDto, user.id);
  }

  @HttpCode(201)
  @Post(':id/join-requests')
  @ApiOperation({ summary: 'Create a new join request for a project' })
  @ApiBody({ type: CreateJoinRequestBodyDto })
  @ApiResponse({ status: 201, description: 'Join request created successfully', type: JoinRequestResponseDto })
  @ApiResponse({ status: 400, description: 'Join request already sent before' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @UseGuards(JwtAuthGuard)
  async createJoinRequest(
    @Param('id') projectId: number,
    @Body() joinRequestDto: CreateJoinRequestBodyDto,
    @GetUser() user: any,
  ): Promise<JoinRequestResponseDto> {
    return await this.projectService.createJoinRequest(user.id, +projectId, joinRequestDto);
  }

  @HttpCode(200)
  @Put(':projectId/join-requests/:requestUserId')
  @ApiOperation({ summary: 'Accept or reject a join request' })
  @ApiParam({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiParam({ name: 'requestUserId', required: true, description: 'ID of the user who sent the join request' })
  @ApiBody({ type: UpdateJoinRequestDto })
  @ApiResponse({ status: 200, description: 'Join request updated successfully' })
  @ApiResponse({ status: 400, description: 'Join request has already been processed' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only the project owner can manage join requests' })
  @ApiResponse({ status: 404, description: 'Project or join request not found' })
  @UseGuards(JwtAuthGuard)
  async handleJoinRequest(
    @Param('projectId') projectId: number,
    @Param('requestUserId') requestUserId: number,
    @Body() updateJoinRequestDto: UpdateJoinRequestDto,
    @GetUser() user: any,
  ): Promise<void> {
    return await this.projectService.handleJoinRequest(
      user.id,
      +projectId,
      +requestUserId,
      updateJoinRequestDto.status,
    );
  }

  @HttpCode(201)
  @Post(':id/like')
  @ApiOperation({ summary: 'Like a project' })
  @ApiParam({ name: 'id', required: true, description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Like project success', type: ProjectResponseDto })
  @ApiResponse({ status: 400, description: 'User has already liked this project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @UseGuards(JwtAuthGuard)
  async likeProject(
    @Param('id') projectId: number,
    @GetUser() user: any,
  ): Promise<ProjectResponseDto> {
    return await this.projectService.likeProject(user.id, +projectId);
  }

  @HttpCode(200)
  @Delete(':id/like')
  @ApiOperation({ summary: 'Unlike a project' })
  @ApiParam({ name: 'id', required: true, description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Unlike project success', type: ProjectResponseDto })
  @ApiResponse({ status: 400, description: 'User has not liked this project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @UseGuards(JwtAuthGuard)
  async unlikeProject(
    @Param('id') projectId: number,
    @GetUser() user: any,
  ): Promise<ProjectResponseDto> {
    return await this.projectService.unlikeProject(user.id, +projectId);
  }
}
