import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/createUser.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(201)
  @Post()
  async createUser(@Body() body: CreateUserDto) {
    await this.userService.IsUserCreateDtoValid(body);
    return this.userService.createUser(body);
  }
}
