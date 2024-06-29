import { UserService } from './user.service';
import { CreateUserDto } from './dtos/createUser.dto';
import { Controller, Get, Post, Body, Param, HttpCode } from '@nestjs/common';

import { User } from './entities/user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(201)
  @Post()
  async createUser(@Body() body: CreateUserDto) {
    await this.userService.IsUserCreateDtoValid(body);
    return this.userService.createUser(body);
  }

  @Get('/:id')
  getUser(@Param('id') userId: number): User {
    return this.userService.getUser(userId);
  }
}
