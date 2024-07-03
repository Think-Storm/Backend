import { AuthService } from './auth.service';
import { Controller, Post, Body } from '@nestjs/common';
import { loginUserDto } from './dtos/loginUser.dto';
import { UserResponseDto } from '../user/dtos/userResponse.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body() body: loginUserDto): Promise<UserResponseDto> {
    return this.authService.login(body);
  }
}
