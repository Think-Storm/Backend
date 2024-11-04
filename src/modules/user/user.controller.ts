import { UserResponseDto } from '../auth/dtos/userResponse.dto';
import { UserService } from './user.service';
import {
  Controller,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  // UseGuards,
} from '@nestjs/common';
//import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  //@UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('/:id')
  async getUserById(@Param('id') userId: number): Promise<UserResponseDto> {
    return this.userService.getUserById(userId);
  }
}
