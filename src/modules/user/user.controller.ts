import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { PostDTO } from './dtos/createUserDto';
import { errorMessages } from '../../common/errorMessages';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getHello(): string {
    return this.userService.getHello();
  }

  @Get('id')
  getGoodBye(@Query('id') id: string): string {
    return this.userService.getGoodbye(id);
  }

  @Post('path')
  postGoodBye(@Body() body: PostDTO): string {
    if (!this.userService.validateUserCreateDto(body)) {
      throw new BadRequestException(
        errorMessages.POST_VALIDATION_ERROR_MESSAGE,
      );
    }

    return JSON.stringify(body);
  }
}
