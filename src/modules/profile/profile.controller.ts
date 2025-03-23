import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
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
    @Request() req,
  ) {
    const profile = await this.profileService.createUserProfile(
      +userId,
      createProfileDto,
      req.user.id,
    );

    return {
      message: 'Create User Profile Success',
      data: profile,
    };
  }
}
