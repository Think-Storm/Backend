import { UserService } from './user.service';
import { CreateUserDto } from './dtos/createUser.dto';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
} from '@nestjs/common';
import { UserResponseDto } from './dtos/userResponse.dto';
import { AuthService } from '../auth/auth.service';
import { Request } from 'express';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(201)
  @Post()
  async createUser(@Body() body: CreateUserDto) {
    await this.userService.isUserCreateDtoValid(body);
    return this.userService.createUser(body);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('/:id')
  async getUserById(
    @Req() req: Request,
    @Param('id') userId: number,
  ): Promise<UserResponseDto> {
    await this.authService.protect(req);
    return this.userService.getUserById(userId);
  }
}
