import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { ProfileService } from './profile.service';
import { CreateUserProfileDto } from './dtos/createUserProfile.dto';
import { UpdateUserProfileDto } from './dtos/updateUserProfile.dto';
import { GetUser } from '../auth/decorators/getUser.decorator';

@ApiTags('profiles')
@Controller()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/:id')
  @ApiOperation({ summary: 'Create user profile' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({ type: CreateUserProfileDto })
  @ApiResponse({
    status: 201,
    description: 'User profile created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or profile already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only create profile for own user',
  })
  async createUserProfile(
    @Param('id') userId: number,
    @Body() createProfileDto: CreateUserProfileDto,
    @GetUser() user: any,
  ) {
    const profile = await this.profileService.createUserProfile(
      +userId,
      createProfileDto,
      user.id,
    );

    return {
      message: 'Create User Profile Success',
      data: profile,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiParam({ name: 'id', type: Number, description: 'Profile ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only view own profile',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async getProfile(@Param('id') profileId: number, @GetUser() user: any) {
    const profile = await this.profileService.getProfileById(
      +profileId,
      user.id,
    );

    return {
      message: 'Get User Profile Success',
      data: profile,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', type: Number, description: 'Profile ID' })
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only update own profile',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async updateProfile(
    @Param('id') profileId: number,
    @Body() updateProfileDto: UpdateUserProfileDto,
    @GetUser() user: any,
  ) {
    const profile = await this.profileService.updateProfile(
      +profileId,
      updateProfileDto,
      user.id,
    );

    return {
      message: 'Update User Profile Success',
      data: profile,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  @ApiOperation({ summary: 'Delete user profile' })
  @ApiParam({ name: 'id', type: Number, description: 'Profile ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only delete own profile',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async deleteProfile(@Param('id') profileId: number, @GetUser() user: any) {
    const profile = await this.profileService.deleteProfile(
      +profileId,
      user.id,
    );

    return {
      message: 'Delete User Profile Success',
      data: profile,
    };
  }
}
