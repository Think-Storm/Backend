import { UserService } from './user.service';
import { CreateUserDto } from './dtos/createUser.dto';
import { Controller, Get, Post, Body, Param, HttpCode } from '@nestjs/common';
import { UserResponseDto } from './dtos/userResponse.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(201)
  @Post()
  async createUser(@Body() body: CreateUserDto) {
    await this.userService.IsUserCreateDtoValid(body);
    return this.userService.createUser(body);
  }

  @Get('/:id')
  async getUserById(@Param('id') userId: number): Promise<UserResponseDto> {
    return this.userService.getUserById(userId);
  }
}
