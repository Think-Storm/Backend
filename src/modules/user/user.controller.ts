import { UserService } from './user.service';
import { CreateUserDto } from './dtos/createUser.dto';
import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  BadRequestException,
  Param,
  HttpCode,
} from '@nestjs/common';
import { PostDTO } from './dtos/createUserDto';
import { errorMessages } from '../../common/errorMessages';
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
  async getUser(@Param('id') userId: number): Promise<User> {
    return this.userService.getUser(userId);
  }
}
