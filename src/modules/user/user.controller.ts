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
} from '@nestjs/common';
import { UserResponseDto } from './dtos/userResponse.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(201)
  @Post()
  async createUser(@Body() body: CreateUserDto) {
    await this.userService.isUserCreateDtoValid(body);
    return this.userService.createUser(body);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('/:id')
  async getUserById(@Param('id') userId: number): Promise<UserResponseDto> {
    return this.userService.getUserById(userId);
  }
}
