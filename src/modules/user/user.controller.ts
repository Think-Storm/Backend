import { UserResponseDto } from '../user/dtos/userResponse.dto';
import { UserService } from './user.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  Res,
  HttpCode,
  Body,
  UseGuards,
  Put,
  Request,
} from '@nestjs/common';
import { UpdateUserDto } from './dtos/updateUser.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AuthService } from '../auth/auth.service';

@ApiTags('users')
@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Get user success',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') userId: number): Promise<UserResponseDto> {
    return await this.userService.getUserById(userId);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Put()
  @ApiOperation({ summary: 'Update user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Update User Success' })
  @ApiResponse({
    status: 400,
    description: 'If email is changed, the new email is used already',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden. Only owner of the account can update user information',
  })
  @ApiResponse({
    status: 404,
    description: 'Updated user is not found',
  })
  async updateUserById(
    @Body() updatedUserData: UpdateUserDto,
    @Request() req,
    @Res() res: Response,
  ): Promise<any> {
    const updatedUser = await this.userService.updateUserById(
      updatedUserData,
      req.user.id,
    );

    const updatedUserWithJwt = this.authService.authentication(
      updatedUser,
      res,
    );

    return res.send({
      message: 'Update User Success',
      data: updatedUserWithJwt,
    });
  }
}
